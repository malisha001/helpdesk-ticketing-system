<?php

use App\Enums\UserRole;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// public routes
Route::post('/login', [AuthController::class, 'login'])
    ->name('auth.login');

Route::post('/register', [AuthController::class, 'register'])
    ->name('auth.register');

// protected routes
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout'])
        ->name('auth.logout');

    // only for active users
    Route::middleware('active.user')->group(function () {

        Route::get('/me', [AuthController::class, 'me'])
            ->name('auth.me');

        Route::patch('/me/profile', [AuthController::class, 'updateProfile'])
            ->name('profile.update');

        Route::get('/dashboard', [DashboardController::class, 'index'])
            ->name('dashboard.index');

        // customer only api
        Route::middleware('role:'.UserRole::Customer->value)->group(function () {
            Route::post('/tickets', [TicketController::class, 'store'])
                ->name('tickets.store');
        });

        // shared api for customers and support agents
        Route::get('/tickets', [TicketController::class, 'index'])
            ->name('tickets.index');

        Route::get('/tickets/{id}', [TicketController::class, 'show'])
            ->whereNumber('id')
            ->name('tickets.show');

        Route::get('/tickets/{id}/attachments/{attachment}/download', [TicketController::class, 'downloadAttachment'])
            ->whereNumber(['id', 'attachment'])
            ->name('tickets.attachments.download');

        // Get authenticated user's notifications
        Route::get('/notifications', [NotificationController::class, 'index'])
            ->name('notifications.index');

        // Mark one notification as read
        Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])
            ->name('notifications.read');

        // suport agent only api
        Route::middleware('role:'.UserRole::SupportAgent->value)->group(function () {
            Route::post('/tickets/{id}/claim', [TicketController::class, 'claim'])
                ->whereNumber('id')
                ->name('tickets.claim');

            Route::patch('/tickets/{id}/status', [TicketController::class, 'updateStatus'])
                ->whereNumber('id')
                ->name('tickets.status.update');
        });

        // Administrator only api
        Route::middleware('role:'.UserRole::Administrator->value)->group(function () {
            Route::get('/users', [UserController::class, 'index'])
                ->name('users.index');

            Route::post('/tickets/{id}/assign', [TicketController::class, 'assign'])
                ->whereNumber('id')
                ->name('tickets.assign');

            Route::post('/tickets/{id}/reassign', [TicketController::class, 'reassign'])
                ->whereNumber('id')
                ->name('tickets.reassign');

            Route::patch('/users/{id}/status', [UserController::class, 'updateStatus'])
                ->whereNumber('id')
                ->name('users.status.update');

            Route::get('/users/{id}', [UserController::class, 'show'])
                ->whereNumber('id')
                ->name('users.show');

            Route::post('/users/agents', [UserController::class, 'storeAgent'])
                ->name('agents.store');
        });

        // Customer and Support Agent APIs
        Route::middleware('role:'.UserRole::Customer->value.'|'.UserRole::SupportAgent->value)->group(function () {
            Route::post('/tickets/{id}/replies', [TicketController::class, 'storeReply'])
                ->whereNumber('id')
                ->name('tickets.replies.store');
        });
    });
});
