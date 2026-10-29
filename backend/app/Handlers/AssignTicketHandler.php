<?php

namespace App\Handlers;

use App\Models\Ticket;
use App\Models\User;
use App\Services\TicketService;
use App\Services\TicketAssignmentService;
use App\Services\TicketHistoryService;
use App\Services\DatabaseTransactionService;

class AssignTicketHandler
{
    public function __construct(
        private TicketService $ticketService,
        private TicketAssignmentService $assignmentService,
        private TicketHistoryService $historyService,
        private DatabaseTransactionService $transactionService
    ) {}

    public function handle(
        User $admin,
        int $ticketId,
        int $agentId
    ): Ticket {

        return $this->transactionService->run(
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
    }
}
