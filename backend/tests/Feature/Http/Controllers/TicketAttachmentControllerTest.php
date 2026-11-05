<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\User;
use App\Notifications\TicketCreatedNotification;
use Illuminate\Filesystem\AwsS3V3Adapter;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use League\Flysystem\UnableToWriteFile;
use Mockery;
use PHPUnit\Framework\Attributes\TestWith;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TicketAttachmentControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['ticket_attachments.disk' => 'local']);
    }

    public function test_r2_disk_resolves_the_real_s3_adapter_without_network_access(): void
    {
        config([
            'filesystems.disks.r2.key' => 'test-access-key',
            'filesystems.disks.r2.secret' => 'test-secret-key',
            'filesystems.disks.r2.bucket' => 'helpdesk-attachments',
            'filesystems.disks.r2.endpoint' => 'https://00000000000000000000000000000000.r2.cloudflarestorage.com',
        ]);
        Storage::forgetDisk('r2');

        $disk = Storage::disk('r2');

        $this->assertInstanceOf(AwsS3V3Adapter::class, $disk);
    }

    public function test_json_creation_without_attachments_preserves_the_response_and_empty_details(): void
    {
        Notification::fake();
        $customer = $this->createUser('customer', ['create-ticket', 'view-own-ticket']);
        $response = $this->actingAs($customer)->postJson('/api/tickets', $this->ticketInput());

        $response->assertCreated()->assertJsonPath('success', 'true');
        $this->getJson('/api/tickets/'.$response->json('ticket.id'))
            ->assertOk()->assertJsonPath('data.attachments', []);
        $this->assertDatabaseCount('ticket_attachments', 0);
        Notification::assertSentTo($customer, TicketCreatedNotification::class);
    }

    #[TestWith(['local'])]
    #[TestWith(['r2'])]
    public function test_multiple_attachments_are_private_and_details_only_expose_safe_metadata(string $diskName): void
    {
        config(['ticket_attachments.disk' => $diskName]);
        $disk = Storage::fake($diskName);
        Notification::fake();
        $customer = $this->createUser('customer', ['create-ticket', 'view-own-ticket']);
        $response = $this->actingAs($customer)->post('/api/tickets', [
            ...$this->ticketInput(),
            'attachments' => [
                UploadedFile::fake()->createWithContent('log.txt', 'Diagnostic log'),
                UploadedFile::fake()->createWithContent('report.pdf', '%PDF-1.4 test document'),
            ],
        ], ['Accept' => 'application/json']);

        $response->assertCreated()->assertJsonPath('success', 'true')->assertJsonPath('ticket.status', 'open');
        $ticketId = $response->json('ticket.id');
        $attachments = TicketAttachment::where('ticket_id', $ticketId)->get();
        $this->assertCount(2, $attachments);
        foreach ($attachments as $attachment) {
            $disk->assertExists($attachment->path);
            $this->assertSame($diskName, $attachment->disk);
            // Windows does not expose Unix file permission bits to Flysystem.
            if (PHP_OS_FAMILY !== 'Windows') {
                $this->assertSame('private', $disk->getVisibility($attachment->path));
            }
            $this->assertSame($customer->id, $attachment->uploaded_by);
            $this->assertStringStartsWith('ticket-attachments/'.$ticketId.'/', $attachment->path);
            $this->assertNotSame($attachment->original_name, basename($attachment->path));
        }
        $details = $this->getJson('/api/tickets/'.$ticketId)->assertOk()->assertJsonCount(2, 'data.attachments');
        $this->assertEqualsCanonicalizing(['id', 'original_name', 'mime_type', 'size', 'download_url'], array_keys($details->json('data.attachments.0')));
        $this->assertSame('/api/tickets/'.$ticketId.'/attachments/'.$attachments[0]->id.'/download', $details->json('data.attachments.0.download_url'));
        $this->assertDatabaseHas('ticket_history', ['ticket_id' => $ticketId, 'action' => 'ticket_created']);
        Notification::assertSentTo($customer, TicketCreatedNotification::class);
        Notification::assertCount(1);
    }

    #[TestWith(['pdf', 'application/pdf'])]
    #[TestWith(['png', 'image/png'])]
    #[TestWith(['jpg', 'image/jpeg'])]
    #[TestWith(['jpeg', 'image/jpeg'])]
    #[TestWith(['txt', 'text/plain'])]
    #[TestWith(['doc', 'application/msword'])]
    #[TestWith(['docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])]
    public function test_allowed_formats_at_the_size_limit_are_accepted(string $extension, string $mime): void
    {
        $disk = Storage::fake('local');
        Notification::fake();
        $customer = $this->createUser('customer', ['create-ticket']);
        $this->actingAs($customer)->postJson('/api/tickets', [
            ...$this->ticketInput(),
            'attachments' => [UploadedFile::fake()->create('file.'.$extension, 5120, $mime)],
        ])->assertCreated();
        $this->assertDatabaseHas('ticket_attachments', ['size' => 5242880, 'mime_type' => $mime]);
        $this->assertCount(1, $disk->allFiles());
        Notification::assertCount(1);
    }

    #[TestWith(['count', 'attachments'])]
    #[TestWith(['size', 'attachments.0'])]
    #[TestWith(['content', 'attachments.0'])]
    #[TestWith(['extension', 'attachments.0'])]
    #[TestWith(['upload', 'attachments.0'])]
    #[TestWith(['not-array', 'attachments'])]
    public function test_invalid_attachments_return_422_without_persistence(string $case, string $field): void
    {
        $disk = Storage::fake('local');
        Notification::fake();
        $customer = $this->createUser('customer', ['create-ticket']);
        $file = UploadedFile::fake()->createWithContent('log.txt', 'Diagnostic log');
        $htmlFile = UploadedFile::fake()->createWithContent('payload.jpg', '<html><body>Unsafe HTML</body></html>');
        $attachments = match ($case) {
            'count' => array_map(fn () => UploadedFile::fake()->create('file.txt', 1), range(1, 6)),
            'size' => [$file->size(5121)],
            // Real UploadedFile MIME detection must reject HTML disguised as a permitted image.
            'content' => [new UploadedFile($htmlFile->getPathname(), 'payload.jpg', 'image/jpeg', null, true)],
            'extension' => [UploadedFile::fake()->create('file.exe', 1, 'text/plain')],
            'upload' => [new UploadedFile($file->getPathname(), 'log.txt', 'text/plain', UPLOAD_ERR_PARTIAL, true)],
            'not-array' => 'log.txt',
        };

        $this->actingAs($customer)->postJson('/api/tickets', [...$this->ticketInput(), 'attachments' => $attachments])
            ->assertUnprocessable()->assertJsonValidationErrors($field);
        $this->assertDatabaseCount('tickets', 0);
        $this->assertDatabaseCount('ticket_attachments', 0);
        $this->assertSame([], $disk->allFiles());
        Notification::assertNothingSent();
    }

    public function test_five_files_are_accepted(): void
    {
        $disk = Storage::fake('local');
        Notification::fake();
        $customer = $this->createUser('customer', ['create-ticket']);
        $this->actingAs($customer)->postJson('/api/tickets', [
            ...$this->ticketInput(),
            'attachments' => array_map(fn () => UploadedFile::fake()->create('file.txt', 1), range(1, 5)),
        ])->assertCreated();
        $this->assertDatabaseCount('ticket_attachments', 5);
        $this->assertCount(5, $disk->allFiles());
        Notification::assertCount(1);
    }

    #[TestWith(['local', 'r2'])]
    #[TestWith(['r2', 'local'])]
    public function test_owner_download_streams_the_original_content_and_safe_headers(string $storedDisk, string $uploadDisk): void
    {
        Storage::fake($storedDisk);
        Storage::fake($uploadDisk);
        config(['ticket_attachments.disk' => $uploadDisk]);
        $customer = $this->createUser('customer', ['view-own-ticket']);
        $attachment = $this->createAttachment($customer, $storedDisk);
        $response = $this->actingAs($customer)->get($attachment->download_url);

        $response->assertOk()->assertDownload('log.txt')->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->assertSame('Diagnostic log', $response->streamedContent());
        $this->assertStringContainsString('private', $response->headers->get('Cache-Control'));
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        $this->assertSame($storedDisk, $attachment->fresh()->disk);
        Storage::disk($storedDisk)->assertExists($attachment->path);
        Storage::disk($uploadDisk)->assertMissing($attachment->path);
    }

    #[TestWith(['anonymous', 401])]
    #[TestWith(['other-customer', 404])]
    #[TestWith(['inactive', 403])]
    #[TestWith(['no-permission', 403])]
    #[TestWith(['anonymous', 401, 'r2'])]
    #[TestWith(['other-customer', 404, 'r2'])]
    #[TestWith(['inactive', 403, 'r2'])]
    #[TestWith(['no-permission', 403, 'r2'])]
    public function test_unauthorized_download_is_rejected(string $case, int $status, string $diskName = 'local'): void
    {
        Storage::fake($diskName);
        $owner = $this->createUser('customer', ['view-own-ticket']);
        $attachment = $this->createAttachment($owner, $diskName);
        if ($case === 'other-customer') {
            $this->actingAs($this->createUser('customer', ['view-own-ticket']));
        } elseif ($case === 'inactive') {
            $owner->update(['is_active' => false]);
            $this->actingAs($owner);
        } elseif ($case === 'no-permission') {
            $this->actingAs($this->createUser('administrator'));
        }

        $this->getJson($attachment->download_url)->assertStatus($status);
    }

    #[TestWith(['administrator', false, 200])]
    #[TestWith(['support_agent', false, 200])]
    #[TestWith(['support_agent', true, 200])]
    #[TestWith(['other-agent', true, 404])]
    public function test_staff_downloads_follow_existing_ticket_access_rules(string $role, bool $assigned, int $status): void
    {
        Storage::fake('local');
        $owner = $this->createUser('customer');
        $attachment = $this->createAttachment($owner);
        $staff = $this->createUser($role === 'administrator' ? $role : 'support_agent', $role === 'administrator'
            ? ['view-all-ticket'] : ['view-assigned-ticket', 'view-unassigned-ticket']);
        if ($assigned) {
            $agent = $role === 'other-agent' ? $this->createUser('support_agent') : $staff;
            $attachment->ticket->assignments()->create(['agent_id' => $agent->id, 'assigned_by' => $agent->id]);
        }

        $response = $this->actingAs($staff)->getJson($attachment->download_url)->assertStatus($status);
        if ($status === 200) {
            $this->assertSame('Diagnostic log', $response->streamedContent());
        }
    }

    #[TestWith(['local'])]
    #[TestWith(['r2'])]
    public function test_attachment_cannot_be_downloaded_under_a_different_ticket(string $diskName): void
    {
        Storage::fake($diskName);
        $owner = $this->createUser('customer', ['view-own-ticket']);
        $first = $this->createAttachment($owner, $diskName);
        $second = $this->createAttachment($owner, $diskName);
        $this->actingAs($owner)->getJson('/api/tickets/'.$first->ticket_id.'/attachments/'.$second->id.'/download')->assertNotFound();
    }

    #[TestWith(['local'])]
    #[TestWith(['r2'])]
    public function test_missing_stored_file_returns_404(string $diskName): void
    {
        $disk = Storage::fake($diskName);
        $owner = $this->createUser('customer', ['view-own-ticket']);
        $attachment = $this->createAttachment($owner, $diskName);
        $disk->delete($attachment->path);
        $this->actingAs($owner)->getJson($attachment->download_url)->assertNotFound();
    }

    public function test_private_storage_cannot_be_read_using_an_unsigned_storage_url(): void
    {
        Storage::fake('local');
        $owner = $this->createUser('customer');
        $attachment = $this->createAttachment($owner);

        $this->get('/storage/'.$attachment->path)->assertForbidden();
    }

    #[TestWith(['local'])]
    #[TestWith(['r2'])]
    public function test_notification_failure_does_not_remove_committed_attachments(string $diskName): void
    {
        config(['ticket_attachments.disk' => $diskName]);
        $disk = Storage::fake($diskName);
        $customer = $this->createUser('customer', ['create-ticket']);
        Notification::shouldReceive('send')->once()->andThrow(new \RuntimeException('Notification transport unavailable'));

        $this->actingAs($customer)->postJson('/api/tickets', [
            ...$this->ticketInput(), 'attachments' => [UploadedFile::fake()->create('log.txt', 1)],
        ])->assertStatus(500);

        $this->assertDatabaseCount('tickets', 1);
        $this->assertDatabaseCount('ticket_history', 1);
        $this->assertDatabaseCount('ticket_attachments', 1);
        $disk->assertExists(TicketAttachment::firstOrFail()->path);
    }

    #[TestWith(['storage'])]
    #[TestWith(['metadata'])]
    #[TestWith(['storage', 'r2'])]
    #[TestWith(['exception', 'r2'])]
    #[TestWith(['metadata', 'r2'])]
    public function test_failed_creation_rolls_back_records_and_only_removes_its_own_files(string $failure, string $diskName = 'local'): void
    {
        config(['ticket_attachments.disk' => $diskName]);
        $disk = Storage::fake($diskName);
        Notification::fake();
        $customer = $this->createUser('customer', ['create-ticket']);
        $disk->put('ticket-attachments/existing/keep.txt', 'Keep this file');
        if ($failure !== 'metadata') {
            $writes = 0;
            $adapter = Mockery::mock(FilesystemAdapter::class);
            $adapter->shouldReceive('putFileAs')->twice()->andReturnUsing(function (...$arguments) use ($disk, &$writes, $failure) {
                $path = $disk->putFileAs(...$arguments);

                if (++$writes === 2 && $failure === 'exception') {
                    throw UnableToWriteFile::atLocation($path, 'Simulated R2 upload failure');
                }

                return $writes === 2 ? false : $path;
            });
            $adapter->shouldReceive('delete')->twice()->andReturnUsing(fn ($path) => $disk->delete($path));
            Storage::set($diskName, $adapter);
        } else {
            DB::unprepared("CREATE TRIGGER reject_attachment BEFORE INSERT ON ticket_attachments WHEN NEW.original_name = 'second.txt' BEGIN SELECT RAISE(ABORT, 'Simulated metadata failure'); END");
        }

        $this->actingAs($customer)->postJson('/api/tickets', [
            ...$this->ticketInput(),
            'attachments' => [UploadedFile::fake()->create('first.txt', 1), UploadedFile::fake()->create('second.txt', 1)],
        ])->assertStatus(500);

        $this->assertDatabaseCount('tickets', 0);
        $this->assertDatabaseCount('ticket_history', 0);
        $this->assertDatabaseCount('ticket_attachments', 0);
        $this->assertSame(['ticket-attachments/existing/keep.txt'], $disk->allFiles());
        $this->assertSame('Keep this file', $disk->get('ticket-attachments/existing/keep.txt'));
        Notification::assertNothingSent();
    }

    private function ticketInput(): array
    {
        return ['subject' => 'Account access', 'description' => 'Please investigate.', 'priority' => 'medium'];
    }

    private function createUser(string $roleName, array $permissions = []): User
    {
        $role = Role::findOrCreate($roleName, 'web');
        foreach ($permissions as $permission) {
            $role->givePermissionTo(Permission::findOrCreate($permission, 'web'));
        }
        $user = User::factory()->create(['is_active' => true]);
        $user->assignRole($role);

        return $user;
    }

    private function createAttachment(User $owner, string $diskName = 'local'): TicketAttachment
    {
        $ticket = Ticket::create([...$this->ticketInput(), 'customer_id' => $owner->id, 'status' => 'open']);
        $path = 'ticket-attachments/'.$ticket->id.'/generated.txt';
        Storage::disk($diskName)->put($path, 'Diagnostic log');

        return $ticket->attachments()->create([
            'uploaded_by' => $owner->id, 'disk' => $diskName, 'path' => $path,
            'original_name' => 'log.txt', 'mime_type' => 'text/plain', 'size' => 14,
        ]);
    }
}
