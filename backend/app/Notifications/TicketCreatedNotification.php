<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketCreatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $ticketId,
        public string $ticketSubject
    ) {
        // Queue only after the database transaction commits
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database', 'broadcast'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Ticket #{$this->ticketId} Created")
            ->greeting("Hello {$notifiable->name},")
            ->line('Your support ticket has been created successfully.')
            ->line("Ticket ID: #{$this->ticketId}")
            ->line("Subject: {$this->ticketSubject}")
            ->line('Our support team will review your request.')
            ->line('Thank you for contacting HelpDesk.');
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'event' => 'ticket_created',
            'title' => "Ticket #{$this->ticketId} Created",
            'message' => 'Your support ticket was created successfully.',
            'ticket_id' => $this->ticketId,
            'url' => "/tickets/{$this->ticketId}",
        ];
    }

    public function toBroadcast(
        object $notifiable
    ): BroadcastMessage {
        return new BroadcastMessage(
            $this->toDatabase($notifiable)
        );
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
