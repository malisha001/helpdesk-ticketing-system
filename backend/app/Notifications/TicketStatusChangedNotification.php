<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketStatusChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $ticketId,
        public string $ticketSubject,
        public string $newStatus
    ) {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $isResolved = $this->newStatus === 'resolved';

        $emailSubject = $isResolved
            ? "Ticket #{$this->ticketId} Resolved"
            : "Action Required - Ticket #{$this->ticketId}";

        $message = $isResolved
            ? 'Your support ticket has been marked as resolved.'
            : 'Our support team is waiting for your response.';

        return (new MailMessage)
            ->subject($emailSubject)
            ->greeting("Hello {$notifiable->name},")
            ->line($message)
            ->line("Ticket ID: #{$this->ticketId}")
            ->line("Subject: {$this->ticketSubject}")
            ->line(
                $isResolved
                    ? 'Thank you for contacting HelpDesk.'
                    : 'Please log in to HelpDesk to review the ticket and reply.'
            );
    }
}
