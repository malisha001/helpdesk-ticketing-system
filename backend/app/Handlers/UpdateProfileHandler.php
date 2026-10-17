<?php

namespace App\Handlers;

use App\Models\User;
use App\Services\UserService;

class UpdateProfileHandler
{
    public function __construct(
        private UserService $userService
    ) {}

    public function handle(
        User $user,
        array $validated
    ): User {

        return $this->userService->updateProfile(
            $user,
            $validated
        );
    }
}
