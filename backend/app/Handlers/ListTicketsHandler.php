<?php

namespace App\Handlers;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ListTicketsHandler
{
    public function handle(
        User $user,
        array $filters = []
    ): LengthAwarePaginator{

        $query = Ticket::query();

        //role-based access
        if ($user->hasRole('customer')) {

            $query->where('customer_id', $user->id);

        } elseif ($user->hasRole('support_agent')) {

            $query->where(function ($q) use ($user) {

                $q->whereDoesntHave('activeAssignment')
                  ->orWhereHas('activeAssignment', function ($assignment) use ($user) {

                      $assignment->where('agent_id', $user->id);

                  });

            });

        } elseif (!$user->hasRole('administrator')) {

            abort(403, 'You are not authorized to view tickets.');

        }

        //search subject and description
        $query->when($filters['search'] ?? null, function ($q, $search) {

            $q->where(function ($subQuery) use ($search) {
                $subQuery->where('subject', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
            });
        });

        //filter by status
        $query->when($filters['status'] ?? null, function ($q, $status) {
            $q->where('status', $status);
        });

        //filter by priority
        $query->when($filters['priority'] ?? null, function ($q, $priority) {
            $q->where('priority', $priority);
        });

        //pagination
        $perPage = $filters['per_page'] ?? 10;

        return $query
            ->with(['customer:id,name', 'activeAssignment.agent:id,name'])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($perPage);
    }
}