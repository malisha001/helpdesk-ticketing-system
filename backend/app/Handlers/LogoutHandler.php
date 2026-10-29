<?php

namespace App\Handlers;

use App\Models\User;
use App\Services\AuthService;

class LogoutHandler
{
    public function __construct(
        private AuthService $authService
    ) {}

    public function handle(User $user): void
    {
        $this->authService->logout($user);
    }
}
