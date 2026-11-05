<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketClaimedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $ticketId,
        public string $ticketSubject,
        public string $agentName
    ) {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database', 'broadcast'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Ticket #{$this->ticketId} - Support Agent Assigned")
            ->greeting("Hello {$notifiable->name},")
            ->line('A support agent has started handling your ticket.')
            ->line("Ticket ID: #{$this->ticketId}")
            ->line("Subject: {$this->ticketSubject}")
            ->line("Support Agent: {$this->agentName}")
            ->line('You can log in to HelpDesk to review your ticket.')
            ->line('Thank you.');
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'event' => 'ticket_claimed',
            'title' => "Ticket #{$this->ticketId} Claimed",
            'message' => "{$this->agentName} has started handling your ticket.",
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
}
