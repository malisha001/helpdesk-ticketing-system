<?php

namespace App\Services;

use App\Enums\TicketStatus;
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
                ->where('status', TicketStatus::Open->value)
                ->count(),

            'in_progress' => (clone $query)
                ->where('status', TicketStatus::InProgress->value)
                ->count(),

            'waiting_for_customer' => (clone $query)
                ->where('status', TicketStatus::WaitingForCustomer->value)
                ->count(),

            'resolved' => (clone $query)
                ->where('status', TicketStatus::Resolved->value)
                ->count(),
        ];
    }

    // Support agent dashboard statistics
    public function agentStats(User $agent): array
    {   // Find tickets actively assigned to Agent 5
        $assignedQuery = Ticket::query()
            ->whereHas('activeAssignment', function ($query) use ($agent) {
                $query->where('agent_id', $agent->id);
            });

        return [
            'unassigned_queue' => Ticket::query()
                ->whereDoesntHave('activeAssignment')
                ->where('status', '!=', TicketStatus::Resolved->value)
                ->count(),

            'assigned_to_me' => (clone $assignedQuery)
                ->where('status', '!=', TicketStatus::Resolved->value)
                ->count(),

            'waiting_for_customer' => (clone $assignedQuery)
                ->where('status', TicketStatus::WaitingForCustomer->value)
                ->count(),

            'my_resolved_tickets' => (clone $assignedQuery)
                ->where('status', TicketStatus::Resolved->value)
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
                ->where('status', '!=', TicketStatus::Resolved->value)
                ->count(),

            'open' => Ticket::query()
                ->where('status', TicketStatus::Open->value)
                ->count(),

            'in_progress' => Ticket::query()
                ->where('status', TicketStatus::InProgress->value)
                ->count(),

            'waiting_for_customer' => Ticket::query()
                ->where('status', TicketStatus::WaitingForCustomer->value)
                ->count(),

            'resolved' => Ticket::query()
                ->where('status', TicketStatus::Resolved->value)
                ->count(),
        ];
    }
}
