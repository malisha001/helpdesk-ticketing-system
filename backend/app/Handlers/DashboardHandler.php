<?php

namespace App\Handlers;

use App\Models\User;
use App\Services\DashboardService;

class DashboardHandler
{
    public function __construct(
        private DashboardService $dashboardService
    ) {}

    public function handle(User $user): array
    {
        // Customer dashboard
        if ($user->hasRole('customer')) {
            return $this->dashboardService
                ->customerStats($user);
        }

        // Support agent dashboard
        if ($user->hasRole('support_agent')) {
            return $this->dashboardService
                ->agentStats($user);
        }

        // Administrator dashboard
        if ($user->hasRole('administrator')) {
            return $this->dashboardService
                ->adminStats();
        }

        abort(403, 'Unauthorized.');
    }
}
