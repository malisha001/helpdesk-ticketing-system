<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\Ticket;
use App\Models\User;
use App\Notifications\TicketAssignmentNotification;
use App\Notifications\TicketClaimedNotification;
use App\Notifications\TicketReplyReceivedNotification;
use App\Notifications\TicketStatusChangedNotification;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Notification;
use PHPUnit\Framework\Attributes\TestWith;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TicketControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_assignment_persists_history_and_notifies_the_agent(): void
    {
        Notification::fake();
        $admin = $this->createUser('administrator', ['assign-ticket']);
        $agent = $this->createUser('support_agent');
        $ticket = $this->createTicket();

        $response = $this->actingAs($admin)->postJson("/api/tickets/{$ticket->id}/assign", ['agent_id' => $agent->id]);

        $response->assertOk()->assertJsonPath('data.agent_id', $agent->id);
        $this->assertDatabaseHas('agent_ticket', ['ticket_id' => $ticket->id, 'agent_id' => $agent->id, 'unassigned_at' => null]);
        $this->assertDatabaseHas('ticket_history', ['ticket_id' => $ticket->id, 'action' => 'ticket_assigned']);
        Notification::assertSentTo($agent, TicketAssignmentNotification::class,
            fn (TicketAssignmentNotification $notification): bool => $notification->ticketId === $ticket->id && ! $notification->isReassignment);
        Notification::assertCount(1);
    }

    public function test_reassignment_notifies_the_new_agent(): void
    {
        Notification::fake();
        $admin = $this->createUser('administrator', ['assign-ticket']);
        $oldAgent = $this->createUser('support_agent');
        $newAgent = $this->createUser('support_agent');
        $ticket = $this->createTicket();
        $assignment = $ticket->assignments()->create(['agent_id' => $oldAgent->id, 'assigned_by' => $admin->id]);

        $response = $this->actingAs($admin)->postJson("/api/tickets/{$ticket->id}/reassign", [
            'agent_id' => $newAgent->id,
            'reason' => 'Shift change',
        ]);

        $response->assertOk()->assertJsonPath('data.new_agent_id', $newAgent->id);
        $this->assertNotNull($assignment->fresh()->unassigned_at);
        $this->assertDatabaseHas('agent_ticket', ['ticket_id' => $ticket->id, 'agent_id' => $newAgent->id, 'unassigned_at' => null]);
        $this->assertDatabaseHas('ticket_history', [
            'ticket_id' => $ticket->id,
            'action' => 'ticket_reassigned',
            'old_value' => (string) $oldAgent->id,
            'new_value' => (string) $newAgent->id,
        ]);
        Notification::assertSentTo($newAgent, TicketAssignmentNotification::class,
            fn (TicketAssignmentNotification $notification): bool => $notification->ticketId === $ticket->id && $notification->isReassignment);
        Notification::assertCount(1);
    }

    public function test_claim_persists_assignment_and_notifies_the_customer(): void
    {
        Notification::fake();
        $agent = $this->createUser('support_agent', ['claim-ticket']);
        $ticket = $this->createTicket();

        $response = $this->actingAs($agent)->postJson("/api/tickets/{$ticket->id}/claim");

        $response->assertOk()->assertJsonPath('data.id', $ticket->id);
        $this->assertDatabaseHas('agent_ticket', ['ticket_id' => $ticket->id, 'agent_id' => $agent->id]);
        $this->assertDatabaseHas('ticket_history', ['ticket_id' => $ticket->id, 'action' => 'ticket_claimed']);
        Notification::assertSentTo($ticket->customer, TicketClaimedNotification::class);
        Notification::assertCount(1);
    }

    #[TestWith(['waiting_for_customer'])]
    #[TestWith(['resolved'])]
    public function test_status_update_persists_history_and_notifies_the_customer(string $newStatus): void
    {
        Notification::fake();
        $agent = $this->createUser('support_agent', ['change-ticket-status', 'resolve-ticket']);
        $ticket = $this->createTicket('in_progress');
        $ticket->assignments()->create(['agent_id' => $agent->id, 'assigned_by' => $agent->id]);

        $response = $this->actingAs($agent)->patchJson("/api/tickets/{$ticket->id}/status", ['status' => $newStatus]);

        $response->assertOk()->assertJsonPath('data.status', $newStatus);
        $this->assertDatabaseHas('tickets', ['id' => $ticket->id, 'status' => $newStatus]);
        $this->assertDatabaseHas('ticket_history', ['ticket_id' => $ticket->id, 'action' => 'status_changed', 'old_value' => 'in_progress', 'new_value' => $newStatus]);
        Notification::assertSentTo($ticket->customer, TicketStatusChangedNotification::class);
        Notification::assertCount(1);
    }

    public function test_customer_reply_resumes_the_ticket_and_notifies_the_agent_once(): void
    {
        Notification::fake();
        $customer = $this->createUser('customer', ['reply-to-ticket']);
        $agent = $this->createUser('support_agent');
        $ticket = $this->createTicket('waiting_for_customer', $customer);
        $ticket->assignments()->create(['agent_id' => $agent->id, 'assigned_by' => $agent->id]);

        $response = $this->actingAs($customer)->postJson("/api/tickets/{$ticket->id}/replies", ['message' => 'More details']);

        $response->assertCreated()->assertJsonPath('data.message', 'More details');
        $this->assertDatabaseHas('ticket_replies', ['id' => $response->json('data.id'), 'ticket_id' => $ticket->id, 'user_id' => $customer->id]);
        $this->assertDatabaseCount('ticket_replies', 1);
        $this->assertDatabaseHas('tickets', ['id' => $ticket->id, 'status' => 'in_progress']);
        $this->assertDatabaseHas('ticket_history', ['ticket_id' => $ticket->id, 'action' => 'reply_added']);
        $this->assertDatabaseHas('ticket_history', ['ticket_id' => $ticket->id, 'action' => 'status_changed', 'old_value' => 'waiting_for_customer', 'new_value' => 'in_progress']);
        Notification::assertSentTo($agent, TicketReplyReceivedNotification::class);
        Notification::assertCount(1);
    }

    public function test_claim_of_an_assigned_ticket_returns_409_without_history_or_notification(): void
    {
        Notification::fake();
        $agent = $this->createUser('support_agent', ['claim-ticket']);
        $ticket = $this->createTicket();
        $ticket->assignments()->create(['agent_id' => $agent->id, 'assigned_by' => $agent->id]);

        $response = $this->actingAs($agent)->postJson("/api/tickets/{$ticket->id}/claim");

        $response->assertConflict()->assertJsonPath('message', 'Ticket is already assigned.');
        $this->assertDatabaseCount('agent_ticket', 1);
        $this->assertDatabaseCount('ticket_history', 0);
        Notification::assertNothingSent();
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

    private function createTicket(string $status = 'open', ?User $customer = null): Ticket
    {
        $customer ??= $this->createUser('customer');

        return Ticket::create([
            'customer_id' => $customer->id,
            'subject' => 'Help with account',
            'description' => 'Cannot access account',
            'priority' => 'medium',
            'status' => $status,
        ]);
    }
}
