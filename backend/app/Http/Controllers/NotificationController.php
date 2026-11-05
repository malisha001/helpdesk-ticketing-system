<?php

namespace App\Http\Controllers;

use App\Handlers\ListNotificationsHandler;
use App\Handlers\MarkNotificationReadHandler;
use App\Http\Requests\ListNotificationsRequest;
use App\Http\Requests\MarkNotificationReadRequest;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    // GET /api/notifications
    public function index(
        ListNotificationsRequest $request,
        ListNotificationsHandler $listNotificationsHandler
    ): JsonResponse {

        $result = $listNotificationsHandler->handle(
            $request->user(),
            $request->validated()
        );

        $notifications = $result['notifications'];

        return response()->json([
            'success' => true,
            'data' => $notifications->items(),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
                'unread_count' => $result['unread_count'],
            ],
        ], 200);
    }

    // PATCH /api/notifications/{id}/read
    public function markAsRead(
        MarkNotificationReadRequest $request,
        MarkNotificationReadHandler $markNotificationReadHandler
    ): JsonResponse {

        $validated = $request->validated();

        $markNotificationReadHandler->handle(
            $request->user(),
            $validated['notification_id']
        );

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read.',
        ], 200);
    }
}
