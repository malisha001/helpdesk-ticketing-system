<?php

namespace App\Handlers;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class ShowTicketHandler
{
    public function handle(User $user, int $ticketId): Ticket
    {
        $query = Ticket::query()->whereKey($ticketId);

        //Customer can view only their own tickets
        if ($user->hasRole('customer')) {

            // Check permission to view own ticket(about_unless = ifnot true, abort)
            abort_unless($user->can('view-own-ticket'), 403);

            return Ticket::where('id', $ticketId)
                ->where('customer_id', $user->id)
                ->firstOrFail();
        }

        // Support Agent: View unassigned or own assigned tickets
        elseif ($user->hasRole('support_agent')) {

            abort_unless(
                $user->can('view-unassigned-ticket') &&
                $user->can('view-assigned-ticket'),
                403
            );

            $query->where(function ($q) use ($user) {

                $q->whereDoesntHave('activeAssignment')
                  ->orWhereHas('activeAssignment', function ($assignment) use ($user) {

                      $assignment->where('agent_id', $user->id);

                  });
            });

        }

        // Administrator: View any ticket
        elseif ($user->hasRole('administrator')) {

            abort_unless($user->can('view-all-ticket'), 403);

        } else {

            abort(403, 'Unauthorized.');
        }

        return $query
            ->with([
                'customer',
                'activeAssignment.agent',
                'replies.user',
                'history.user'
            ])
            ->firstOrFail();
    }
}
