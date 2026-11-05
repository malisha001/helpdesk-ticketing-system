<?php

namespace App\Handlers;

use App\Models\User;
use App\Services\NotificationService;

class MarkNotificationReadHandler
{
    public function __construct(
        private NotificationService $notificationService
    ) {}

    public function handle(
        User $user,
        string $notificationId
    ): void {
        $this->notificationService->markAsRead(
            $user,
            $notificationId
        );
    }
}
