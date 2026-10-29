<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\User;
use App\Notifications\TicketAssignmentNotification;
use App\Notifications\TicketClaimedNotification;
use App\Notifications\TicketCreatedNotification;
use App\Notifications\TicketReplyReceivedNotification;
use App\Notifications\TicketStatusChangedNotification;

class TicketNotificationService
{
    // Existing functionality — KEEP
    public function notifyTicketCreated(
        User $customer,
        Ticket $ticket
    ): void {
        $customer->notify(
            new TicketCreatedNotification(
                $ticket->id,
                $ticket->subject
            )
        );
    }

    // NEW — Ticket assigned
    public function notifyTicketAssigned(
        Ticket $ticket,
        int $agentId
    ): void {
        $this->notifyAgent(
            $ticket,
            $agentId,
            false
        );
    }

    // NEW — Ticket reassigned
    public function notifyTicketReassigned(
        Ticket $ticket,
        int $agentId
    ): void {
        $this->notifyAgent(
            $ticket,
            $agentId,
            true
        );
    }

    // Shared notification logic
    private function notifyAgent(
        Ticket $ticket,
        int $agentId,
        bool $isReassignment
    ): void {
        $agent = User::findOrFail($agentId);

        $agent->notify(
            new TicketAssignmentNotification(
                $ticket->id,
                $ticket->subject,
                $isReassignment
            )
        );
    }

    public function notifyTicketReplied(
        int $ticketId,
        User $sender
    ): void {

        // 1. Get ticket with customer and active assignment
        $ticket = Ticket::query()
            ->with(['customer', 'activeAssignment'])
            ->findOrFail($ticketId);

        // 2. Determine who should receive the notification
        if ($sender->id === $ticket->customer_id) {

            // Customer replied:
            // Notify the currently assigned agent
            $agentId = $ticket->activeAssignment?->agent_id;

            if ($agentId === null) {
                return;
            }

            $recipient = User::find($agentId);

        } else {

            // Support agent replied:
            // Notify the ticket customer
            $recipient = $ticket->customer;
        }

        // 3. Do not email a missing or inactive recipient
        if (
            ! $recipient ||
            ! $recipient->is_active ||
            $recipient->id === $sender->id
        ) {
            return;
        }

        // 4. Queue the notification
        $recipient->notify(
            new TicketReplyReceivedNotification(
                $ticket->id,
                $ticket->subject,
                $sender->name
            )
        );
    }

    // Notify customer when an agent claims their ticket
    public function notifyTicketClaimed(
        Ticket $ticket,
        User $agent
    ): void {
        // Database lookup is handled in the service
        $customer = $ticket->customer;

        if (! $customer || ! $customer->is_active) {
            return;
        }

        $customer->notify(
            new TicketClaimedNotification(
                $ticket->id,
                $ticket->subject,
                $agent->name
            )
        );
    }

    // Notify customer of important status changes
    public function notifyTicketStatusChanged(
        Ticket $ticket
    ): void {
        // Only these two statuses require an email
        if (! in_array(
            $ticket->status,
            ['waiting_for_customer', 'resolved'],
            true
        )) {
            return;
        }

        $customer = $ticket->customer;

        if (! $customer || ! $customer->is_active) {
            return;
        }

        $customer->notify(
            new TicketStatusChangedNotification(
                $ticket->id,
                $ticket->subject,
                $ticket->status
            )
        );
    }
}
