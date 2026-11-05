<?php

namespace App\Services;

use App\Enums\TicketStatus;
use App\Models\Ticket;
use App\Models\TicketHistory;
use App\Models\TicketReply;
use App\Models\User;

class TicketHistoryService
{
    public function recordClaim(
        Ticket $ticket,
        User $agent
    ): TicketHistory {

        return $ticket->history()->create([
            'user_id' => $agent->id,
            'action' => 'ticket_claimed',
            'old_value' => null,
            'new_value' => (string) $agent->id,
        ]);
    }

    public function recordCreation(
        Ticket $ticket,
        User $customer
    ): TicketHistory {

        return $ticket->history()->create([
            'user_id' => $customer->id,
            'action' => 'ticket_created',
            'old_value' => null,
            'new_value' => TicketStatus::Open->value,
        ]);
    }

    public function recordAssignment(
        Ticket $ticket,
        User $agent,
        User $admin
    ): TicketHistory {

        return $ticket->history()->create([
            'user_id' => $admin->id,
            'action' => 'ticket_assigned',
            'old_value' => null,
            'new_value' => (string) $agent->id,
        ]);
    }

    public function recordReassignment(
        Ticket $ticket,
        User $admin,
        int $previousAgentId,
        int $newAgentId
    ): TicketHistory {

        return $ticket->history()->create([
            'user_id' => $admin->id,
            'action' => 'ticket_reassigned',
            'old_value' => (string) $previousAgentId,
            'new_value' => (string) $newAgentId,
        ]);
    }

    public function recordStatusChange(
        Ticket $ticket,
        User $agent,
        string $oldStatus,
        string $newStatus
    ): TicketHistory {

        return $ticket->history()->create([
            'user_id' => $agent->id,
            'action' => 'status_changed',
            'old_value' => $oldStatus,
            'new_value' => $newStatus,
        ]);
    }

    public function recordReply(
        Ticket $ticket,
        User $user,
        TicketReply $reply
    ): TicketHistory {

        return $ticket->history()->create([
            'user_id' => $user->id,
            'action' => 'reply_added',
            'old_value' => null,
            'new_value' => (string) $reply->id,
        ]);
    }
}
