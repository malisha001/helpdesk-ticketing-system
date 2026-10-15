<?php

namespace App\Handlers;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CreateTicketHandler
{
    public function handle(array $validated, User $customer): Ticket
    {
        return DB::transaction(function () use ($validated, $customer) {

            $ticket = Ticket::create([
                'customer_id' => $customer->id,
                'subject' => $validated['subject'],
                'description' => $validated['description'],
                'priority' => $validated['priority'],
                'status' => 'open',
            ]);

            $ticket->history()->create([
                'user_id' => $customer->id,
                'action' => 'created',
                'old_value' => null,
                'new_value' => json_encode($ticket->toArray()),
            ]);

            return $ticket;
        });
    }
}