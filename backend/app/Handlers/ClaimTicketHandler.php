<?php

namespace App\Handlers;

use App\Models\Ticket;
use App\Models\User;
use App\Services\DatabaseTransactionService;
use App\Services\TicketAssignmentService;
use App\Services\TicketHistoryService;
use App\Services\TicketNotificationService;
use App\Services\TicketService;

class ClaimTicketHandler
{
    public function __construct(
        private TicketAssignmentService $assignmentService,
        private TicketHistoryService $ticketHistoryService,
        private TicketService $ticketService,
        private DatabaseTransactionService $transactionService,
        private TicketNotificationService $notificationService
    ) {}

    public function handle(User $agent, int $ticketId): Ticket
    {
        $ticket = $this->transactionService->run(
            function () use ($agent, $ticketId) {

                // Find and lock the ticket for update
                $ticket = $this->ticketService
                    ->findAndLock($ticketId);

                // claim ticket by the agent
                $this->assignmentService
                    ->claim($ticket, $agent);

                // Record the claim action in the ticket history
                $this->ticketHistoryService->recordClaim($ticket, $agent);

                return $ticket;

            });
        // NEW: Notify the customer after the successful claim
        $this->notificationService->notifyTicketClaimed(
            $ticket,
            $agent
        );

        return $ticket;
    }
}
