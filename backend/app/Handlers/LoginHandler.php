<?php

namespace App\Handlers;

use App\Services\AuthService;

class LoginHandler
{
    public function __construct(
        private AuthService $authService
    ) {}

    public function handle(array $validated): array
    {
        return $this->authService->login($validated);
    }
}
