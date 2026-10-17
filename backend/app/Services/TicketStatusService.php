<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\User;
use App\Models\TicketHistory;

class TicketStatusService
{
    public function updateStatus(
        Ticket $ticket,
        User $agent,
        string $newStatus
    ): string {

        // 1. Check whether this agent is assigned to the ticket
        $isAssigned = $ticket->activeAssignment()
            ->where('agent_id', $agent->id)
            ->exists();

        if (!$isAssigned) {
            abort(403, 'You are not assigned to this ticket.');
        }

        // 2. Define allowed status transitions
        $allowedTransitions = [
            'open' => ['in_progress'],

            'in_progress' => [
                'waiting_for_customer',
                'resolved'
            ],

            'waiting_for_customer' => ['in_progress'],

            'resolved' => [],
        ];

        // 3. Get current status
        $oldStatus = $ticket->status;

        // 4. Check whether the transition is allowed
        if (!in_array(
            $newStatus,
            $allowedTransitions[$oldStatus] ?? [],
            true
        )) {
            abort(409, 'Invalid ticket status transition.');
        }

        // 5. Update ticket status in database
        $ticket->update([
            'status' => $newStatus,
        ]);

        // 6. Return previous status for history
        return $oldStatus;
    }

    public function resumeAfterCustomerReply(
        Ticket $ticket,
        User $customer
    ): bool {

        // 1. Only customers can trigger automatic resumption
        if (!$customer->hasRole('customer')) {
            return false;
        }

        // 2. Verify ticket ownership
        if ((int) $ticket->customer_id !== (int) $customer->id) {
            abort(403, 'You cannot update this ticket.');
        }

        // 3. Only update tickets waiting for a customer
        if ($ticket->status !== 'waiting_for_customer') {
            return false;
        }

        // 4. Update ticket status
        $ticket->update([
            'status' => 'in_progress',
        ]);

        // 5. Indicate that the status changed
        return true;
    }

    
}
