<?php

namespace App\Handlers;

use App\Models\Ticket;
use App\Models\User;
use App\Services\DatabaseTransactionService;
use App\Services\NotificationService;
use App\Services\TicketHistoryService;
use App\Services\TicketService;

class UpdateTicketStatusHandler
{
    public function __construct(
        private TicketService $ticketService,
        private TicketHistoryService $historyService,
        private DatabaseTransactionService $transactionService,
        private NotificationService $notificationService
    ) {}

    public function handle(
        User $agent,
        int $ticketId,
        string $newStatus
    ): Ticket {

        $ticket = $this->transactionService->run(
            function () use ($agent, $ticketId, $newStatus) {

                // 1. Find and lock the ticket
                $ticket = $this->ticketService
                    ->findAndLock($ticketId);

                // 2. Validate and update ticket status
                $oldStatus = $this->ticketService
                    ->updateStatus($ticket, $agent, $newStatus);

                // 3. Record the status change
                $this->historyService->recordStatusChange(
                    $ticket,
                    $agent,
                    $oldStatus,
                    $newStatus
                );

                // 4. Return the updated ticket
                return $ticket;
            }
        );
        // NEW: Dispatch only important status notifications
        $this->notificationService->notifyTicketStatusChanged(
            $ticket
        );

        return $ticket;
    }
}
