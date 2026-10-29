<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketReplyReceivedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $ticketId,
        public string $ticketSubject,
        public string $senderName
    ) {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("New Reply on Ticket #{$this->ticketId}")
            ->greeting("Hello {$notifiable->name},")
            ->line("{$this->senderName} has replied to a support ticket.")
            ->line("Ticket ID: #{$this->ticketId}")
            ->line("Subject: {$this->ticketSubject}")
            ->line('Please log in to HelpDesk to review the new reply.')
            ->line('Thank you.');
    }
}
