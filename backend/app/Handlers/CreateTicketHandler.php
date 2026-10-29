<?php

namespace App\Handlers;

use App\Models\Ticket;
use App\Models\User;
use App\Services\DatabaseTransactionService;
use App\Services\TicketHistoryService;
use App\Services\TicketNotificationService;
use App\Services\TicketService;

class CreateTicketHandler
{
    public function __construct(
        private TicketService $ticketService,
        private TicketHistoryService $historyService,
        private DatabaseTransactionService $transactionService,
        private TicketNotificationService $notificationService
    ) {}

    public function handle(
        array $validated,
        User $customer
    ): Ticket {

        // 1. Create the ticket and history in a transaction
        $ticket = $this->transactionService->run(
            function () use ($validated, $customer) {

                // Create ticket through TicketService
                $ticket = $this->ticketService->create(
                    $validated,
                    $customer
                );

                // Record ticket creation in history
                $this->historyService->recordCreation(
                    $ticket,
                    $customer
                );

                return $ticket;
            }
        );

        // 2. Transaction succeeded.
        // Dispatch the confirmation notification.
        $this->notificationService->notifyTicketCreated(
            $customer,
            $ticket
        );

        // 3. Return created ticket to the controller
        return $ticket;
    }
}
