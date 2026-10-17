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
use App\Handlers\AssignTicketHandler;
use App\Http\Requests\AssignTicketRequest;
use App\Handlers\ReassignTicketHandler;
use App\Http\Requests\ReassignTicketRequest;
use App\Handlers\UpdateTicketStatusHandler;
use App\Http\Requests\UpdateTicketStatusRequest;
use App\Handlers\StoreTicketReplyHandler;
use App\Http\Requests\StoreTicketReplyRequest;
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

    public function assign(
        AssignTicketRequest $request,
        AssignTicketHandler $handler,
        int $id
    ): JsonResponse {

        $ticket = $handler->handle(
            $request->user(),
            $id,
            (int) $request->validated('agent_id')
        );

        return response()->json([
            'success' => true,
            'message' => 'Ticket assigned successfully.',
            'data' => [
                'ticket_id' => $ticket->id,
                'agent_id' => (int) $request->validated('agent_id'),
                'status' => $ticket->status,
            ],
        ], 200);
    }

    public function reassign(
        ReassignTicketRequest $request,
        ReassignTicketHandler $handler,
        int $id
    ): JsonResponse {

        $validated = $request->validated();

        $ticket = $handler->handle(
            $request->user(),
            $id,
            (int) $validated['agent_id'],
            $validated['reason'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => 'Ticket reassigned successfully.',
            'data' => [
                'ticket_id' => $ticket->id,
                'new_agent_id' => (int) $validated['agent_id'],
                'status' => $ticket->status,
            ],
        ], 200);
    }

    public function updateStatus(
        UpdateTicketStatusRequest $request,
        UpdateTicketStatusHandler $handler,
        int $id
    ): JsonResponse {

        $validated = $request->validated();

        $ticket = $handler->handle(
            $request->user(),
            $id,
            $validated['status']
        );

        return response()->json([
            'success' => true,
            'message' => 'Ticket status updated successfully.',
            'data' => [
                'id' => $ticket->id,
                'status' => $ticket->status,
            ],
        ], 200);
    }

    public function storeReply(
        StoreTicketReplyRequest $request,
        StoreTicketReplyHandler $handler,
        int $id
    ): JsonResponse {

        $validated = $request->validated();

        $reply = $handler->handle(
            $request->user(),
            $id,
            $validated['message']
        );

        return response()->json([
            'success' => true,
            'message' => 'Reply added successfully.',
            'data' => [
                'id' => $reply->id,
                'ticket_id' => $reply->ticket_id,
                'user_id' => $reply->user_id,
                'message' => $reply->message,
                'created_at' => $reply->created_at,
            ],
        ], 201);
    }


}
