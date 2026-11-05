<?php

namespace App\Services;

use App\Enums\TicketStatus;
use App\Models\Ticket;
use App\Models\User;
use App\Notifications\TicketAssignmentNotification;
use App\Notifications\TicketClaimedNotification;
use App\Notifications\TicketCreatedNotification;
use App\Notifications\TicketReplyReceivedNotification;
use App\Notifications\TicketStatusChangedNotification;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Notifications\DatabaseNotification;

class NotificationService
{
    // Get notifications belonging to the authenticated user
    public function paginateForUser(
        User $user,
        int $perPage = 10
    ): LengthAwarePaginator {

        $notifications = $user->notifications()
            ->latest()
            ->paginate($perPage);

        return $notifications->through(
            function (DatabaseNotification $notification): array {
                $data = $notification->data;

                return [
                    'id' => $notification->id,
                    'event' => $data['event'] ?? 'notification',
                    'title' => $data['title'] ?? 'Notification',
                    'message' => $data['message'] ?? '',
                    'ticket_id' => $data['ticket_id'] ?? null,
                    'url' => $data['url'] ?? null,
                    'read_at' => $notification->read_at?->toIso8601String(),
                    'created_at' => $notification->created_at?->toIso8601String(),
                ];
            }
        );
    }

    // Count this user's unread notifications
    public function unreadCountForUser(User $user): int
    {
        return $user->unreadNotifications()->count();
    }

    // Mark one of this user's notifications as read
    public function markAsRead(
        User $user,
        string $notificationId
    ): void {
        $notification = $user->notifications()
            ->where('id', $notificationId)
            ->firstOrFail();

        if ($notification->read_at === null) {
            $notification->markAsRead();
        }
    }

    public function notifyTicketCreated(
        User $customer,
        Ticket $ticket
    ): void {
        $customer->notify(
            new TicketCreatedNotification(
                $ticket->id,
                $ticket->subject
            )
        );
    }

    public function notifyTicketAssigned(
        Ticket $ticket,
        int $agentId
    ): void {
        $this->notifyAgent($ticket, $agentId, false);
    }

    public function notifyTicketReassigned(
        Ticket $ticket,
        int $agentId
    ): void {
        $this->notifyAgent($ticket, $agentId, true);
    }

    public function notifyTicketReplied(
        int $ticketId,
        User $sender
    ): void {
        $ticket = Ticket::query()
            ->with(['customer', 'activeAssignment'])
            ->findOrFail($ticketId);

        if ($sender->id === $ticket->customer_id) {
            $agentId = $ticket->activeAssignment?->agent_id;

            if ($agentId === null) {
                return;
            }

            $recipient = User::find($agentId);
        } else {
            $recipient = $ticket->customer;
        }

        if (
            ! $recipient ||
            ! $recipient->is_active ||
            $recipient->id === $sender->id
        ) {
            return;
        }

        $recipient->notify(
            new TicketReplyReceivedNotification(
                $ticket->id,
                $ticket->subject,
                $sender->name
            )
        );
    }

    public function notifyTicketClaimed(
        Ticket $ticket,
        User $agent
    ): void {
        $customer = $ticket->customer;

        if (! $customer || ! $customer->is_active) {
            return;
        }

        $customer->notify(
            new TicketClaimedNotification(
                $ticket->id,
                $ticket->subject,
                $agent->name
            )
        );
    }

    public function notifyTicketStatusChanged(Ticket $ticket): void
    {
        if (! in_array(
            $ticket->status,
            [TicketStatus::WaitingForCustomer->value, TicketStatus::Resolved->value],
            true
        )) {
            return;
        }

        $customer = $ticket->customer;

        if (! $customer || ! $customer->is_active) {
            return;
        }

        $customer->notify(
            new TicketStatusChangedNotification(
                $ticket->id,
                $ticket->subject,
                $ticket->status
            )
        );
    }

    private function notifyAgent(
        Ticket $ticket,
        int $agentId,
        bool $isReassignment
    ): void {
        $agent = User::findOrFail($agentId);

        $agent->notify(
            new TicketAssignmentNotification(
                $ticket->id,
                $ticket->subject,
                $isReassignment
            )
        );
    }
}
