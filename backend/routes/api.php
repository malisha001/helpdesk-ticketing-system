<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\AuthController;

//public routes
Route::post('/login', [AuthController::class, 'login']);

Route::post('/register', [AuthController::class, 'register']);

//protected routes
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);

    //only for active users
    Route::middleware('active.user')->group(function () {

        Route::get('/me', [AuthController::class, 'me']);

        Route::get('/tickets', [TicketController::class, 'index']);

        Route::post('/tickets', [TicketController::class, 'store']);

        Route::get('/tickets/{id}', [TicketController::class, 'show'])
            ->whereNumber('id');

        Route::post('/tickets/{id}/claim', [TicketController::class, 'claim'])
            ->whereNumber('id');

        Route::post('/tickets/{id}/assign', [TicketController::class, 'assign'])
            ->whereNumber('id');

        Route::post('/tickets/{id}/reassign', [TicketController::class, 'reassign'])
            ->whereNumber('id');
    });
});
