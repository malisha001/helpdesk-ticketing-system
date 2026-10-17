<?php

namespace App\Handlers;

use App\Services\UserService;

class ShowUserHandler
{
    public function __construct(
        private UserService $userService
    ) {}

    public function handle(int $userId): array
    {
        return $this->userService->findById($userId);
    }
}
