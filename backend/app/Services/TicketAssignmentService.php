<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\TicketAgent;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class TicketAssignmentService
{
    // Existing agent claim function
    public function claim(Ticket $ticket, User $agent): TicketAgent
    {
        if ($ticket->status === 'resolved') {
            abort(409, 'Resolved tickets cannot be claimed.');
        }

        if ($ticket->activeAssignment()->exists()) {
            abort(409, 'Ticket is already assigned.');
        }

        return $ticket->assignments()->create([
            'agent_id' => $agent->id,
            'assigned_by' => $agent->id,
            'assigned_at' => now(),
            'unassigned_at' => null,
            'reason' => null,
        ]);
    }

    // NEW: Find a valid support agent
    public function findEligibleAgent(int $agentId): User
    {
        $agent = User::find($agentId);

        if (
            !$agent ||
            !$agent->is_active ||
            !$agent->hasRole('support_agent')
        ) {
            throw ValidationException::withMessages([
                'agent_id' => 'Please select an active support agent.',
            ]);
        }

        return $agent;
    }

    // NEW: Administrator assigns a ticket
    public function assign(
        Ticket $ticket,
        User $agent,
        User $admin
    ): TicketAgent {

        if ($ticket->status === 'resolved') {
            abort(409, 'Resolved tickets cannot be assigned.');
        }

        if ($ticket->activeAssignment()->exists()) {
            abort(409, 'Ticket is already assigned.');
        }

        return $ticket->assignments()->create([
            'agent_id' => $agent->id,
            'assigned_by' => $admin->id,
            'assigned_at' => now(),
            'unassigned_at' => null,
            'reason' => null,
        ]);
    }

    public function reassign(
        Ticket $ticket,
        User $newAgent,
        User $admin,
        ?string $reason = null
    ): array {

        // 1. Check ticket status
        if ($ticket->status === 'resolved') {
            abort(409, 'Resolved tickets cannot be reassigned.');
        }

        // 2. Find current active assignment
        $currentAssignment = $ticket->activeAssignment()->first();

        if (!$currentAssignment) {
            abort(409, 'Ticket is not currently assigned.');
        }

        // 3. Check if the agent is the same
        if ($currentAssignment->agent_id == $newAgent->id) {
            abort(409, 'Ticket is already assigned to this agent.');
        }

        // Remember previous agent for ticket history
        $previousAgentId = $currentAssignment->agent_id;

        $reassignedAt = now();

        // 4. Close previous assignment
        $currentAssignment->update([
            'unassigned_at' => $reassignedAt,
            'reason' => $reason,
        ]);

        // 5. Create new assignment
        $newAssignment = $ticket->assignments()->create([
            'agent_id' => $newAgent->id,
            'assigned_by' => $admin->id,
            'assigned_at' => $reassignedAt,
            'unassigned_at' => null,
            'reason' => null,
        ]);

        return [
            'previous_agent_id' => $previousAgentId,
            'assignment' => $newAssignment,
        ];
    }

}
