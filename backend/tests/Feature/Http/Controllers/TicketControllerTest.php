<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\Ticket;
use App\Models\User;
use App\Notifications\TicketAssignmentNotification;
use App\Notifications\TicketClaimedNotification;
use App\Notifications\TicketCreatedNotification;
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

    #[TestWith(['low'])]
    #[TestWith(['medium'])]
    #[TestWith(['high'])]
    public function test_ticket_creation_preserves_string_status_and_priority(string $priority): void
    {
        Notification::fake([TicketCreatedNotification::class]);
        $customer = $this->createUser('customer', ['create-ticket']);

        $response = $this->actingAs($customer)->postJson(route('tickets.store', [], false), [
            'subject' => 'Account access',
            'description' => 'Please help with my account.',
            'priority' => $priority,
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', 'true')
            ->assertJsonPath('ticket.status', 'open')
            ->assertJsonPath('ticket.priority', $priority);
        $ticket = Ticket::findOrFail($response->json('ticket.id'));
        $this->assertSame('open', $ticket->status);
        $this->assertSame($priority, $ticket->priority);
        $this->assertDatabaseHas('ticket_history', ['ticket_id' => $ticket->id, 'action' => 'ticket_created', 'new_value' => 'open']);
        Notification::assertSentTo($customer, TicketCreatedNotification::class);
        Notification::assertCount(1);
    }

    public function test_invalid_priority_returns_422_without_creating_a_ticket(): void
    {
        Notification::fake([TicketCreatedNotification::class]);
        $customer = $this->createUser('customer', ['create-ticket']);

        $response = $this->actingAs($customer)->postJson(route('tickets.store', [], false), [
            'subject' => 'Account access',
            'description' => 'Please help with my account.',
            'priority' => 'urgent',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors([
            'priority' => 'The selected priority is invalid.',
        ]);
        $this->assertDatabaseCount('tickets', 0);
        Notification::assertNothingSent();
    }

    #[TestWith(['open', 'low'])]
    #[TestWith(['in_progress', 'medium'])]
    #[TestWith(['waiting_for_customer', 'high'])]
    #[TestWith(['resolved', 'medium'])]
    public function test_ticket_filters_preserve_string_values_and_pagination(string $status, string $priority): void
    {
        $admin = $this->createUser('administrator', ['view-all-ticket']);
        $ticket = $this->createTicket($status);
        $ticket->update(['priority' => $priority]);
        $other = $this->createTicket($status === 'open' ? 'resolved' : 'open');
        $other->update(['priority' => $priority]);
        $wrongPriority = $this->createTicket($status);
        $wrongPriority->update(['priority' => $priority === 'high' ? 'low' : 'high']);

        $response = $this->actingAs($admin)->getJson(route('tickets.index', [], false).'?'.http_build_query([
            'status' => $status,
            'priority' => $priority,
            'per_page' => 1,
        ]));

        $response->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $ticket->id)
            ->assertJsonPath('data.0.status', $status)
            ->assertJsonPath('data.0.priority', $priority)
            ->assertJsonPath('meta.total', 1);
    }

    #[TestWith(['status', 'closed'])]
    #[TestWith(['priority', 'urgent'])]
    public function test_invalid_ticket_filters_return_422(string $field, string $value): void
    {
        $admin = $this->createUser('administrator', ['view-all-ticket']);

        $response = $this->actingAs($admin)->getJson(route('tickets.index', [], false).'?'.http_build_query([$field => $value]));

        $response->assertUnprocessable()->assertJsonValidationErrors([
            $field => "The selected {$field} is invalid.",
        ]);
    }

    #[TestWith(['open'])]
    #[TestWith(['waiting_for_customer'])]
    public function test_starting_or_resuming_work_preserves_history_without_status_notification(string $oldStatus): void
    {
        Notification::fake([TicketStatusChangedNotification::class]);
        $agent = $this->createUser('support_agent', ['change-ticket-status']);
        $ticket = $this->createTicket($oldStatus);
        $ticket->assignments()->create(['agent_id' => $agent->id, 'assigned_by' => $agent->id]);

        $response = $this->actingAs($agent)->patchJson(route('tickets.status.update', ['id' => $ticket->id], false), ['status' => 'in_progress']);

        $response->assertOk()->assertJsonPath('data.status', 'in_progress');
        $this->assertSame('in_progress', $ticket->fresh()->status);
        $this->assertDatabaseHas('ticket_history', ['ticket_id' => $ticket->id, 'old_value' => $oldStatus, 'new_value' => 'in_progress']);
        Notification::assertNothingSent();
    }

    #[TestWith(['open', 'open'])]
    #[TestWith(['open', 'waiting_for_customer'])]
    #[TestWith(['open', 'resolved'])]
    #[TestWith(['in_progress', 'open'])]
    #[TestWith(['in_progress', 'in_progress'])]
    #[TestWith(['waiting_for_customer', 'open'])]
    #[TestWith(['waiting_for_customer', 'waiting_for_customer'])]
    #[TestWith(['waiting_for_customer', 'resolved'])]
    #[TestWith(['resolved', 'open'])]
    #[TestWith(['resolved', 'in_progress'])]
    #[TestWith(['resolved', 'waiting_for_customer'])]
    #[TestWith(['resolved', 'resolved'])]
    public function test_invalid_transitions_return_409_without_changes(string $oldStatus, string $newStatus): void
    {
        Notification::fake([TicketStatusChangedNotification::class]);
        $agent = $this->createUser('support_agent', ['change-ticket-status', 'resolve-ticket']);
        $ticket = $this->createTicket($oldStatus);
        $ticket->assignments()->create(['agent_id' => $agent->id, 'assigned_by' => $agent->id]);

        $response = $this->actingAs($agent)->patchJson(route('tickets.status.update', ['id' => $ticket->id], false), ['status' => $newStatus]);

        $response->assertConflict()->assertJsonPath('message', 'Invalid ticket status transition.');
        $this->assertSame($oldStatus, $ticket->fresh()->status);
        $this->assertDatabaseCount('ticket_history', 0);
        Notification::assertNothingSent();
    }

    public function test_resolving_without_resolve_permission_returns_403(): void
    {
        Notification::fake([TicketStatusChangedNotification::class]);
        $agent = $this->createUser('support_agent', ['change-ticket-status']);
        $ticket = $this->createTicket('in_progress');
        $ticket->assignments()->create(['agent_id' => $agent->id, 'assigned_by' => $agent->id]);

        $response = $this->actingAs($agent)->patchJson(route('tickets.status.update', ['id' => $ticket->id], false), ['status' => 'resolved']);

        $response->assertForbidden();
        $this->assertSame('in_progress', $ticket->fresh()->status);
        $this->assertDatabaseCount('ticket_history', 0);
        Notification::assertNothingSent();
    }

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
