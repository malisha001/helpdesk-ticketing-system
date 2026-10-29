<?php

namespace App\Handlers;

use App\Models\TicketReply;
use App\Models\User;
use App\Services\DatabaseTransactionService;
use App\Services\TicketHistoryService;
use App\Services\TicketNotificationService;
use App\Services\TicketReplyService;
use App\Services\TicketService;
use App\Services\TicketStatusService;

class StoreTicketReplyHandler
{
    public function __construct(
        private TicketService $ticketService,
        private TicketReplyService $replyService,
        private TicketStatusService $statusService,
        private TicketHistoryService $historyService,
        private DatabaseTransactionService $transactionService,
        private TicketNotificationService $notificationService
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
                $reply = $this->replyService
                    ->createReply($ticket, $user, $message);

                // 3. Record reply history
                $this->historyService
                    ->recordReply($ticket, $user, $reply);

                // 4. Resume ticket if a customer reply requires it
                $statusChanged = $this->statusService
                    ->resumeAfterCustomerReply($ticket, $user);

                // 5. Record automatic status change
                if ($statusChanged) {
                    $this->historyService->recordStatusChange(
                        $ticket,
                        $user,
                        'waiting_for_customer',
                        'in_progress'
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
