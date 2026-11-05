<?php

namespace App\Handlers;

use App\Models\User;
use App\Services\TicketAttachmentService;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DownloadTicketAttachmentHandler
{
    public function __construct(
        private ShowTicketHandler $showTicketHandler,
        private TicketAttachmentService $attachmentService,
    ) {}

    public function handle(User $user, int $ticketId, int $attachmentId): StreamedResponse
    {
        $ticket = $this->showTicketHandler->handle($user, $ticketId);

        return $this->attachmentService->download($ticket, $attachmentId);
    }
}
