<?php

namespace App\Handlers;

use App\Services\UserService;
use Illuminate\Pagination\LengthAwarePaginator;

class ListUsersHandler
{
    public function __construct(
        private UserService $userService
    ) {}

    public function handle(array $filters = []): LengthAwarePaginator
    {
        return $this->userService->listUsers($filters);
    }
}
