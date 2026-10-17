<?php

namespace App\Handlers;

use App\Models\User;
use App\Services\UserService;
use App\Services\DatabaseTransactionService;

class CreateAgentHandler
{
    public function __construct(
        private UserService $userService,
        private DatabaseTransactionService $transactionService
    ) {}

    public function handle(array $validated): User
    {
        return $this->transactionService->run(
            function () use ($validated) {

                // Create support agent using UserService
                $agent = $this->userService
                    ->createSupportAgent($validated);

                return $agent;
            }
        );
    }
}
