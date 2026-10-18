<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DashboardController;

//public routes
Route::post('/login', [AuthController::class, 'login']);

Route::post('/register', [AuthController::class, 'register']);

//protected routes
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);

    //only for active users
    Route::middleware('active.user')->group(function () {

        Route::get('/me', [AuthController::class, 'me']);

        Route::patch('/me/profile', [AuthController::class, 'updateProfile']);

        Route::get('/dashboard', [DashboardController::class, 'index']);

        //customer only api
        Route::middleware('role:customer')->group(function () {
            Route::post('/tickets', [TicketController::class, 'store']);
        });

        //shared api for customers and support agents
        Route::get('/tickets', [TicketController::class, 'index']);

        Route::get('/tickets/{id}', [TicketController::class, 'show'])
            ->whereNumber('id');

        //suport agent only api
        Route::middleware('role:support_agent')->group(function () {
            Route::post('/tickets/{id}/claim', [TicketController::class, 'claim'])
                ->whereNumber('id');

            Route::patch('/tickets/{id}/status', [TicketController::class, 'updateStatus'])
                ->whereNumber('id');
        });

        //Administrator only api
        Route::middleware('role:administrator')->group(function () {
            Route::get('/users', [UserController::class, 'index']);

            Route::post('/tickets/{id}/assign', [TicketController::class, 'assign'])
                ->whereNumber('id');

            Route::post('/tickets/{id}/reassign', [TicketController::class, 'reassign'])
                ->whereNumber('id');

            Route::patch('/users/{id}/status', [UserController::class, 'updateStatus'])
                ->whereNumber('id');

            Route::get('/users/{id}', [UserController::class, 'show'])
                ->whereNumber('id');

            Route::post('/users/agents', [UserController::class, 'storeAgent']);
        });

        //Customer and Support Agent APIs
        Route::middleware('role:customer|support_agent')->group(function () {
            Route::post('/tickets/{id}/replies', [TicketController::class, 'storeReply'])
                ->whereNumber('id');
        });
    });
});
