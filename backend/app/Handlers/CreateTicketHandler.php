<?php

namespace App\Handlers;

use App\Models\Ticket;
use App\Models\User;
use App\Services\DatabaseTransactionService;
use App\Services\NotificationService;
use App\Services\TicketAttachmentService;
use App\Services\TicketHistoryService;
use App\Services\TicketService;
use Throwable;

class CreateTicketHandler
{
    public function __construct(
        private TicketService $ticketService,
        private TicketHistoryService $historyService,
        private DatabaseTransactionService $transactionService,
        private NotificationService $notificationService,
        private TicketAttachmentService $attachmentService,
    ) {}

    public function handle(
        array $validated,
        User $customer
    ): Ticket {

        $storedFiles = [];
        try {
            $ticket = $this->transactionService->run(
                function () use ($validated, $customer, &$storedFiles) {

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

                    $this->attachmentService->storeForTicket($ticket, $customer, $validated['attachments'] ?? [], $storedFiles);

                    return $ticket;
                }
            );
        } catch (Throwable $exception) {
            $this->attachmentService->removeNewFiles($storedFiles);
            throw $exception;
        }

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
