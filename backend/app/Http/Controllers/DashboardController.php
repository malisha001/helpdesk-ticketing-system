<?php

namespace App\Http\Controllers;

use App\Handlers\DashboardHandler;
use App\Http\Requests\DashboardRequest;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(
        DashboardRequest $request,
        DashboardHandler $handler
    ): JsonResponse {

        // 1. Get dashboard statistics
        $stats = $handler->handle($request->user());

        // 2. Return JSON response
        return response()->json([
            'success' => true,
            'data' => $stats,
        ], 200);
    }
}
