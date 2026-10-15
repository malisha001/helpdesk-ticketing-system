<?php

namespace App\Http\Controllers;

use App\Handlers\CreateTicketHandler;
use App\Handlers\ListTicketsHandler;
use App\Handlers\ShowTicketHandler;
use App\Http\Requests\ListTicketsRequest;
use App\Http\Requests\StoreTicketRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Handlers\ClaimTicketHandler;
use App\Http\Requests\ClaimTicketRequest;

class TicketController extends Controller
{
    public function store(
        StoreTicketRequest $request,
        CreateTicketHandler $handler
    ): JsonResponse {

        // Create a new ticket using the validated data
        $ticket = $handler->handle(
            $request->validated(),
            $request->user()
        );

        // Return a response indicating success
        return response()->json([
            'success' => 'true',
            'message' => 'Ticket created successfully',
            'ticket' => $ticket,
        ], 201);
    }
    public function index(
        ListTicketsRequest $request,
        ListTicketsHandler $handler
    ): JsonResponse {
        // Get the list of tickets for the authenticated user
        $tickets = $handler->handle(
            $request->user(),
            $request->validated()
        );

        // Return the list of tickets in a JSON response
        return response()->json([
            'success' => true,
            'data' => $tickets->items(),
            'meta' => [
                'current_page' => $tickets->currentPage(),
                'last_page' => $tickets->lastPage(),
                'per_page' => $tickets->perPage(),
                'total' => $tickets->total(),
            ],
        ]);
    }
    public function show(
        Request $request,
        ShowTicketHandler $handler,
        int $id
    ): JsonResponse {
        $ticket = $handler->handle($request->user(), $id);

        return response()->json([
            'success' => true,
            'data' => $ticket,
        ],200);
    }
    public function claim(
        ClaimTicketRequest $request,
        ClaimTicketHandler $handler,
        int $id
    ): JsonResponse {

        $ticket = $handler->handle($request->user(), $id);

        return response()->json([
            'success' => true,
            'message' => 'Ticket claimed successfully.',
            'data' => $ticket->load('activeAssignment.agent'),
        ], 200);
    }
}
