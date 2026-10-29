<?php

namespace App\Handlers;

use App\Models\Ticket;
use App\Models\User;
use App\Services\DatabaseTransactionService;
use App\Services\TicketAssignmentService;
use App\Services\TicketHistoryService;
use App\Services\TicketNotificationService;
use App\Services\TicketService;

class AssignTicketHandler
{
    public function __construct(
        private TicketService $ticketService,
        private TicketAssignmentService $assignmentService,
        private TicketHistoryService $historyService,
        private DatabaseTransactionService $transactionService,
        private TicketNotificationService $notificationService
    ) {}

    public function handle(
        User $admin,
        int $ticketId,
        int $agentId
    ): Ticket {

        $ticket = $this->transactionService->run(
            function () use ($admin, $ticketId, $agentId) {

                // Find and lock the ticket
                $ticket = $this->ticketService
                    ->findAndLock($ticketId);

                // Find an eligible support agent
                $agent = $this->assignmentService
                    ->findEligibleAgent($agentId);

                // Assign the ticket
                $this->assignmentService
                    ->assign($ticket, $agent, $admin);

                // Record ticket history
                $this->historyService
                    ->recordAssignment($ticket, $agent, $admin);

                // Return the ticket
                return $ticket;
            }
        );
        // Only reached after successful transaction
        $this->notificationService->notifyTicketAssigned(
            $ticket,
            $agentId
        );

        return $ticket;
    }
}
