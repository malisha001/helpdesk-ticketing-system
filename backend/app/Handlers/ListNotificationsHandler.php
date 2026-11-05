<?php

namespace App\Handlers;

use App\Models\User;
use App\Services\NotificationService;

class ListNotificationsHandler
{
    public function __construct(
        private NotificationService $notificationService
    ) {}

    public function handle(
        User $user,
        array $filters
    ): array {
        $perPage = (int) ($filters['per_page'] ?? 10);

        return [
            'notifications' => $this->notificationService->paginateForUser(
                $user,
                $perPage
            ),

            'unread_count' => $this->notificationService->unreadCountForUser(
                $user
            ),
        ];
    }
}
