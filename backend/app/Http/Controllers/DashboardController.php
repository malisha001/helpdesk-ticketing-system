<?php

namespace App\Http\Controllers;

use App\Handlers\DashboardHandler;
use App\Http\Requests\DashboardRequest;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(
        DashboardRequest $request,
        DashboardHandler $dashboardHandler
    ): JsonResponse {

        // Get dashboard statistics
        $stats = $dashboardHandler->handle($request->user());

        return response()->json([
            'success' => true,
            'data' => $stats,
        ], 200);
    }
}
