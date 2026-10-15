<?php

namespace App\Handlers;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ClaimTicketHandler
{
    public function handle(User $agent, int $ticketId): Ticket
    {
        return DB::transaction(function () use ($agent, $ticketId) {

            // Find the ticket and lock it
            $ticket = Ticket::where('id', $ticketId)
                ->lockForUpdate()
                ->firstOrFail();

            // Check if the ticket is resolved
            if ($ticket->status === 'resolved') {
                abort(409, 'Resolved tickets cannot be claimed.');
            }

            // Check if an active agent already exists
            if ($ticket->activeAssignment()->exists()) {
                abort(409, 'Ticket is already assigned.');
            }

            // Create agent assignment
            $ticket->assignments()->create([
                'agent_id' => $agent->id,
                'assigned_by' => $agent->id,
                'assigned_at' => now(),
                'unassigned_at' => null,
                'reason' => null,
            ]);

            // Save ticket history
            $ticket->history()->create([
                'user_id' => $agent->id,
                'action' => 'ticket_claimed',
                'old_value' => null,
                'new_value' => (string) $agent->id,
            ]);

            return $ticket;
        });
    }
}
