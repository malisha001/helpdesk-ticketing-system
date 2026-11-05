<?php

namespace App\Handlers;

use App\Enums\TicketStatus;
use App\Models\TicketReply;
use App\Models\User;
use App\Services\DatabaseTransactionService;
use App\Services\NotificationService;
use App\Services\TicketHistoryService;
use App\Services\TicketService;

class StoreTicketReplyHandler
{
    public function __construct(
        private TicketService $ticketService,
        private TicketHistoryService $historyService,
        private DatabaseTransactionService $transactionService,
        private NotificationService $notificationService
    ) {}

    public function handle(
        User $user,
        int $ticketId,
        string $message
    ): TicketReply {

        $reply = $this->transactionService->run(
            function () use ($user, $ticketId, $message) {

                // 1. Find and lock ticket
                $ticket = $this->ticketService
                    ->findAndLock($ticketId);

                // 2. Validate access and create reply
                $reply = $this->ticketService
                    ->createReply($ticket, $user, $message);

                // 3. Record reply history
                $this->historyService
                    ->recordReply($ticket, $user, $reply);

                // 4. Resume ticket if a customer reply requires it
                $statusChanged = $this->ticketService
                    ->resumeAfterCustomerReply($ticket, $user);

                // 5. Record automatic status change
                if ($statusChanged) {
                    $this->historyService->recordStatusChange(
                        $ticket,
                        $user,
                        TicketStatus::WaitingForCustomer->value,
                        TicketStatus::InProgress->value
                    );
                }

                // 6. Return the created reply
                return $reply;
            }
        );

        $this->notificationService->notifyTicketReplied(
            $ticketId,
            $user
        );

        return $reply;

    }
}
