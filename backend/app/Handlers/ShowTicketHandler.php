<?php

namespace App\Handlers;

use App\Models\Ticket;
use App\Models\User;
use App\Services\TicketService;

class ShowTicketHandler
{
    public function __construct(
        private TicketService $ticketService
    ) {}

    public function handle(User $user, int $ticketId): Ticket
    {
        // Customer
        if ($user->hasRole('customer')) {

            abort_unless(
                $user->can('view-own-ticket'),
                403
            );

            return $this->ticketService
                ->findForCustomer($ticketId, $user);
        }

        // Support Agent
        if ($user->hasRole('support_agent')) {

            abort_unless(
                $user->can('view-unassigned-ticket') &&
                $user->can('view-assigned-ticket'),
                403
            );

            return $this->ticketService
                ->findForAgent($ticketId, $user);
        }

        // Administrator
        if ($user->hasRole('administrator')) {

            abort_unless(
                $user->can('view-all-ticket'),
                403
            );

            return $this->ticketService
                ->findForAdmin($ticketId);
        }

        abort(403, 'Unauthorized.');
    }
}
