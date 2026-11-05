<?php

namespace App\Handlers;

use App\Enums\UserRole;
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
        if ($user->hasRole(UserRole::Customer->value)) {
            return $this->dashboardService
                ->customerStats($user);
        }

        // Support agent dashboard
        if ($user->hasRole(UserRole::SupportAgent->value)) {
            return $this->dashboardService
                ->agentStats($user);
        }

        // Administrator dashboard
        if ($user->hasRole(UserRole::Administrator->value)) {
            return $this->dashboardService
                ->adminStats();
        }

        abort(403, 'Unauthorized.');
    }
}
