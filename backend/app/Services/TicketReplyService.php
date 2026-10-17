<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\TicketReply;
use App\Models\User;

class TicketReplyService
{
    public function createReply(
        Ticket $ticket,
        User $user,
        string $message
    ): TicketReply {

        // 1. Check customer ownership
        if ($user->hasRole('customer')) {

            if ((int) $ticket->customer_id !== (int) $user->id) {
                abort(403, 'You cannot reply to this ticket.');
            }

        }
        // 2. Check support agent assignment
        elseif ($user->hasRole('support_agent')) {

            $isAssigned = $ticket->activeAssignment()
                ->where('agent_id', $user->id)
                ->exists();

            if (!$isAssigned) {
                abort(403, 'You are not assigned to this ticket.');
            }

        } else {
            abort(403, 'You are not allowed to reply.');
        }

        // 3. Check whether ticket is resolved
        if ($ticket->status === 'resolved') {
            abort(409, 'Cannot reply to a resolved ticket.');
        }

        // 4. Save reply
        return $ticket->replies()->create([
            'user_id' => $user->id,
            'message' => $message,
        ]);
    }
}
