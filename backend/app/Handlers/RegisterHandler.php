<?php

namespace App\Handlers;

use App\Models\User;
use App\Services\DatabaseTransactionService;
use App\Services\UserService;

class RegisterHandler
{
    public function __construct(
        private UserService $userService,
        private DatabaseTransactionService $transactionService
    ) {}

    public function handle(array $validated): User
    {
        return $this->transactionService->run(
            function () use ($validated): User {
                return $this->userService->createCustomer($validated);
            }
        );
    }
}
