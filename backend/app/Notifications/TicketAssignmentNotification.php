<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketAssignmentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $ticketId,
        public string $ticketSubject,
        public bool $isReassignment = false
    ) {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $subject = $this->isReassignment
            ? "Ticket #{$this->ticketId} Reassigned to You"
            : "Ticket #{$this->ticketId} Assigned to You";

        $message = $this->isReassignment
            ? 'A support ticket has been reassigned to you.'
            : 'A new support ticket has been assigned to you.';

        return (new MailMessage)
            ->subject($subject)
            ->greeting("Hello {$notifiable->name},")
            ->line($message)
            ->line("Ticket ID: #{$this->ticketId}")
            ->line("Subject: {$this->ticketSubject}")
            ->line('Please log in to HelpDesk to review the ticket.')
            ->line('Thank you.');
    }
}
