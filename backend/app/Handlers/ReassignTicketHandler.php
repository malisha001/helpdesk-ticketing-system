<?php

namespace App\Handlers;

use App\Models\Ticket;
use App\Models\User;
use App\Services\DatabaseTransactionService;
use App\Services\TicketAssignmentService;
use App\Services\TicketHistoryService;
use App\Services\TicketNotificationService;
use App\Services\TicketService;

class ReassignTicketHandler
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
        int $newAgentId,
        ?string $reason = null
    ): Ticket {

        $ticket = $this->transactionService->run(
            function () use ($admin, $ticketId, $newAgentId, $reason) {

                // 1. Find and lock the ticket
                $ticket = $this->ticketService
                    ->findAndLock($ticketId);

                // 2. Find and validate the new agent
                $newAgent = $this->assignmentService
                    ->findEligibleAgent($newAgentId);

                // 3. Reassign the ticket
                $result = $this->assignmentService
                    ->reassign($ticket, $newAgent, $admin, $reason);

                // 4. Record reassignment history
                $this->historyService->recordReassignment(
                    $ticket,
                    $admin,
                    (int) $result['previous_agent_id'],
                    $newAgent->id
                );

                // 5. Return the ticket
                return $ticket;
            }
        );
        $this->notificationService->notifyTicketReassigned(
            $ticket,
            $newAgentId
        );

        return $ticket;
    }
}
