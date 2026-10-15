<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\TicketAgent;
use App\Models\User;

class TicketAssignmentService
{
    public function claim(Ticket $ticket, User $agent): TicketAgent
    {
        // Check ticket status
        if ($ticket->status === 'resolved') {
            abort(409, 'Resolved tickets cannot be claimed.');
        }

        // Check if an active agent already exists
        if ($ticket->activeAssignment()->exists()) {
            abort(409, 'Ticket is already assigned.');
        }

        // Create agent assignment
        return $ticket->assignments()->create([
            'agent_id' => $agent->id,
            'assigned_by' => $agent->id,
            'assigned_at' => now(),
            'unassigned_at' => null,
            'reason' => null,
        ]);

    }
}
