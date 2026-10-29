<?php

namespace App\Handlers;

use App\Models\User;
use App\Services\DatabaseTransactionService;
use App\Services\UserService;

class UpdateUserStatusHandler
{
    public function __construct(
        private UserService $userService,
        private DatabaseTransactionService $transactionService
    ) {}

    public function handle(User $admin, int $userId, bool $isActive): User
    {
        return $this->transactionService->run(
            function () use ($admin, $userId, $isActive): User {
                return $this->userService->updateActiveStatus($admin, $userId, $isActive);
            }
        );
    }
}
