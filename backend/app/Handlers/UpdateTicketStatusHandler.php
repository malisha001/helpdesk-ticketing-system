<?php

namespace App\Handlers;

use App\Models\Ticket;
use App\Models\User;
use App\Services\TicketService;
use App\Services\TicketStatusService;
use App\Services\TicketHistoryService;
use App\Services\DatabaseTransactionService;

class UpdateTicketStatusHandler
{
    public function __construct(
        private TicketService $ticketService,
        private TicketStatusService $statusService,
        private TicketHistoryService $historyService,
        private DatabaseTransactionService $transactionService
    ) {}

    public function handle(
        User $agent,
        int $ticketId,
        string $newStatus
    ): Ticket {

        return $this->transactionService->run(
            function () use ($agent, $ticketId, $newStatus) {

                // 1. Find and lock the ticket
                $ticket = $this->ticketService
                    ->findAndLock($ticketId);

                // 2. Validate and update ticket status
                $oldStatus = $this->statusService
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
    }
}
