<?php

namespace App\Handlers;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Container\Attributes\Database;
use Illuminate\Support\Facades\DB;
use App\Services\TicketAssignmentService;
use App\Services\TicketHistoryService;
use App\Services\TicketService;
use App\Services\DatabaseTransactionService;

class ClaimTicketHandler
{
    public function __construct(
        private TicketAssignmentService $assignmentService,
        private TicketHistoryService $ticketHistoryService,
        private TicketService $ticketService,
        private DatabaseTransactionService $transactionService

    )
    {}

    public function handle(User $agent, int $ticketId): Ticket
    {
        return $this->transactionService->run(
            function () use ($agent, $ticketId) {

            // Find and lock the ticket for update
            $ticket = $this->ticketService
                ->findAndLock($ticketId);

            //claim ticket by the agent
            $this->assignmentService
                ->claim($ticket, $agent);

            // Record the claim action in the ticket history
            $this->ticketHistoryService->recordClaim($ticket, $agent);

            return $ticket;

        });
    }
}
