<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\TicketHistory;
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
            'new_value' => 'open',
        ]);
    }
}
