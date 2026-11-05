<?php

namespace App\Services;

use App\Enums\TicketStatus;
use App\Enums\UserRole;
use App\Models\Ticket;
use App\Models\TicketReply;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class TicketService
{
    public function findAndLock(int $ticketId): Ticket
    {
        return Ticket::where('id', $ticketId)
            ->lockForUpdate()
            ->firstOrFail();
    }

    public function create(array $data, User $customer): Ticket
    {
        return Ticket::create([
            'customer_id' => $customer->id,
            'subject' => $data['subject'],
            'description' => $data['description'],
            'priority' => $data['priority'],
            'status' => TicketStatus::Open->value,
        ]);
    }

    public function createReply(
        Ticket $ticket,
        User $user,
        string $message
    ): TicketReply {
        if ($user->hasRole(UserRole::Customer->value)) {
            if ((int) $ticket->customer_id !== (int) $user->id) {
                abort(403, 'You cannot reply to this ticket.');
            }
        } elseif ($user->hasRole(UserRole::SupportAgent->value)) {
            $isAssigned = $ticket->activeAssignment()
                ->where('agent_id', $user->id)
                ->exists();

            if (! $isAssigned) {
                abort(403, 'You are not assigned to this ticket.');
            }
        } else {
            abort(403, 'You are not allowed to reply.');
        }

        if ($ticket->status === TicketStatus::Resolved->value) {
            abort(409, 'Cannot reply to a resolved ticket.');
        }

        return $ticket->replies()->create([
            'user_id' => $user->id,
            'message' => $message,
        ]);
    }

    public function updateStatus(
        Ticket $ticket,
        User $agent,
        string $newStatus
    ): string {
        $isAssigned = $ticket->activeAssignment()
            ->where('agent_id', $agent->id)
            ->exists();

        if (! $isAssigned) {
            abort(403, 'You are not assigned to this ticket.');
        }

        $allowedTransitions = [
            TicketStatus::Open->value => [TicketStatus::InProgress->value],
            TicketStatus::InProgress->value => [
                TicketStatus::WaitingForCustomer->value,
                TicketStatus::Resolved->value,
            ],
            TicketStatus::WaitingForCustomer->value => [TicketStatus::InProgress->value],
            TicketStatus::Resolved->value => [],
        ];

        $oldStatus = $ticket->status;

        if (! in_array(
            $newStatus,
            $allowedTransitions[$oldStatus] ?? [],
            true
        )) {
            abort(409, 'Invalid ticket status transition.');
        }

        $ticket->update([
            'status' => $newStatus,
        ]);

        return $oldStatus;
    }

    public function resumeAfterCustomerReply(
        Ticket $ticket,
        User $customer
    ): bool {
        if (! $customer->hasRole(UserRole::Customer->value)) {
            return false;
        }

        if ((int) $ticket->customer_id !== (int) $customer->id) {
            abort(403, 'You cannot update this ticket.');
        }

        if ($ticket->status !== TicketStatus::WaitingForCustomer->value) {
            return false;
        }

        $ticket->update([
            'status' => TicketStatus::InProgress->value,
        ]);

        return true;
    }

    // Get tickets belonging to a customer
    public function listForCustomer(
        User $customer,
        array $filters
    ): LengthAwarePaginator {

        $query = Ticket::query()
            ->where('customer_id', $customer->id);

        return $this->paginateTickets($query, $filters);
    }

    // Get unassigned tickets and tickets assigned to this agent
    public function listForAgent(
        User $agent,
        array $filters
    ): LengthAwarePaginator {

        $query = Ticket::query()
            ->where(function (Builder $q) use ($agent) {

                $q->whereDoesntHave('activeAssignment')
                    ->orWhereHas(
                        'activeAssignment',
                        function (Builder $assignment) use ($agent) {
                            $assignment->where('agent_id', $agent->id);
                        }
                    );
            });

        return $this->paginateTickets($query, $filters);
    }

    // Administrator can view every ticket
    public function listForAdmin(
        array $filters
    ): LengthAwarePaginator {

        $query = Ticket::query();

        return $this->paginateTickets($query, $filters);
    }

    // Shared filtering and pagination logic
    private function paginateTickets(
        Builder $query,
        array $filters
    ): LengthAwarePaginator {

        // Search by subject or description
        if (! empty($filters['search'])) {

            $search = $filters['search'];

            $query->where(function (Builder $q) use ($search) {
                $q->where('subject', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by ticket status
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Filter by ticket priority
        if (! empty($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }

        return $query
            ->with([
                'customer:id,name,email',
                'activeAssignment.agent:id,name',
            ])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($filters['per_page'] ?? 10);
    }

    public function findForCustomer(
        int $ticketId,
        User $customer
    ): Ticket {

        $query = Ticket::query()
            ->whereKey($ticketId)
            ->where('customer_id', $customer->id);

        return $this->findWithDetails($query);
    }
    //Unassigned tickets + Tickets assigned to me, with filters and pagination applied.
    public function findForAgent(
        int $ticketId,
        User $agent
    ): Ticket {

        $query = Ticket::query()
            ->whereKey($ticketId)
            ->where(function (Builder $q) use ($agent) {
                //whereDoesntHave-Find tickets that have no active assignment.
                $q->whereDoesntHave('activeAssignment')
                //orWhereHas-Find tickets that have an active assignment with the specified agent ID.
                    ->orWhereHas(
                        'activeAssignment',
                        function (Builder $assignment) use ($agent) {
                            $assignment->where('agent_id', $agent->id);
                        }
                    );
            });

        return $this->findWithDetails($query);
    }

    public function findForAdmin(int $ticketId): Ticket
    {
        $query = Ticket::query()
            ->whereKey($ticketId);

        return $this->findWithDetails($query);
    }

    private function findWithDetails(Builder $query): Ticket
    {
        return $query
            ->with([
                'customer:id,name,email',
                'activeAssignment.agent:id,name',
                'replies.user:id,name',
                'history.user:id,name',
                'attachments',
            ])
            ->firstOrFail();
    }
}
