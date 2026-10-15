<?php

namespace App\Handlers;

use App\Models\Ticket;
use App\Models\User;
use App\Services\TicketHistoryService;
use App\Services\TicketService;
use Illuminate\Container\Attributes\Database;
use Illuminate\Support\Facades\DB;
use App\Services\DatabaseTransactionService;

class CreateTicketHandler
{
    public function __construct(
        private TicketService $ticketService,
        private TicketHistoryService $ticketHistoryService,
        private DatabaseTransactionService $transactionService
    )
    {}
    public function handle(array $validated, User $customer): Ticket
    {
        return $this->transactionService->run(
            function () use ($validated, $customer) {
                //create ticket
                $ticket = $this->ticketService->create($validated, $customer);
                //record ticket creation in history
                $this->ticketHistoryService->recordCreation($ticket, $customer);
                
                return $ticket;
        });
    }
}
