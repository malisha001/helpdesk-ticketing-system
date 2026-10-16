<?php

namespace App\Handlers;

use App\Models\User;
use App\Services\TicketService;
use Illuminate\Pagination\LengthAwarePaginator;

class ListTicketsHandler
{
    public function __construct(
        private TicketService $ticketService
    ) {}

    public function handle(
        User $user,
        array $filters = []
    ): LengthAwarePaginator {

        // Customer tickets
        if ($user->hasRole('customer')) {

            abort_unless($user->can('view-own-ticket'), 403);

            return $this->ticketService
                ->listForCustomer($user, $filters);
        }

        // Support agent tickets
        if ($user->hasRole('support_agent')) {

            abort_unless(
                $user->can('view-unassigned-ticket') &&
                $user->can('view-assigned-ticket'),
                403
            );

            return $this->ticketService
                ->listForAgent($user, $filters);
        }

        // Administrator tickets
        if ($user->hasRole('administrator')) {

            abort_unless($user->can('view-all-ticket'), 403);

            return $this->ticketService
                ->listForAdmin($filters);
        }

        abort(403, 'Unauthorized.');
    }
}
