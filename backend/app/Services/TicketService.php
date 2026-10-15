<?php

namespace App\Services;

use App\Models\Ticket;
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
            'status' => 'open',
        ]);
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
        if (!empty($filters['search'])) {

            $search = $filters['search'];

            $query->where(function (Builder $q) use ($search) {
                $q->where('subject', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by ticket status
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Filter by ticket priority
        if (!empty($filters['priority'])) {
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

    public function findForAgent(
        int $ticketId,
        User $agent
    ): Ticket {

        $query = Ticket::query()
            ->whereKey($ticketId)
            ->where(function (Builder $q) use ($agent) {

                $q->whereDoesntHave('activeAssignment')
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
            ])
            ->firstOrFail();
    }

}
