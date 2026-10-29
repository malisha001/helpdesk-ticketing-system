<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\User;

class DashboardService
{
    // Customer dashboard statistics
    public function customerStats(User $customer): array
    {
        $query = Ticket::query()
            ->where('customer_id', $customer->id);

        return [
            'total_tickets' => (clone $query)->count(),

            'open' => (clone $query)
                ->where('status', 'open')
                ->count(),

            'in_progress' => (clone $query)
                ->where('status', 'in_progress')
                ->count(),

            'waiting_for_customer' => (clone $query)
                ->where('status', 'waiting_for_customer')
                ->count(),

            'resolved' => (clone $query)
                ->where('status', 'resolved')
                ->count(),
        ];
    }

    // Support agent dashboard statistics
    public function agentStats(User $agent): array
    {
        $assignedQuery = Ticket::query()
            ->whereHas('activeAssignment', function ($query) use ($agent) {
                $query->where('agent_id', $agent->id);
            });

        return [
            'unassigned_queue' => Ticket::query()
                ->whereDoesntHave('activeAssignment')
                ->where('status', '!=', 'resolved')
                ->count(),

            'assigned_to_me' => (clone $assignedQuery)
                ->where('status', '!=', 'resolved')
                ->count(),

            'waiting_for_customer' => (clone $assignedQuery)
                ->where('status', 'waiting_for_customer')
                ->count(),

            'my_resolved_tickets' => (clone $assignedQuery)
                ->where('status', 'resolved')
                ->count(),
        ];
    }

    // Administrator dashboard statistics
    public function adminStats(): array
    {
        return [
            'total_tickets' => Ticket::count(),

            'unassigned' => Ticket::query()
                ->whereDoesntHave('activeAssignment')
                ->where('status', '!=', 'resolved')
                ->count(),

            'open' => Ticket::query()
                ->where('status', 'open')
                ->count(),

            'in_progress' => Ticket::query()
                ->where('status', 'in_progress')
                ->count(),

            'waiting_for_customer' => Ticket::query()
                ->where('status', 'waiting_for_customer')
                ->count(),

            'resolved' => Ticket::query()
                ->where('status', 'resolved')
                ->count(),
        ];
    }
}
