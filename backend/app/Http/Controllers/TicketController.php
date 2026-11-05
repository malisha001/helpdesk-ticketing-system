<?php

namespace App\Http\Controllers;

use App\Handlers\AssignTicketHandler;
use App\Handlers\ClaimTicketHandler;
use App\Handlers\CreateTicketHandler;
use App\Handlers\DownloadTicketAttachmentHandler;
use App\Handlers\ListTicketsHandler;
use App\Handlers\ReassignTicketHandler;
use App\Handlers\ShowTicketHandler;
use App\Handlers\StoreTicketReplyHandler;
use App\Handlers\UpdateTicketStatusHandler;
use App\Http\Requests\AssignTicketRequest;
use App\Http\Requests\ClaimTicketRequest;
use App\Http\Requests\DownloadTicketAttachmentRequest;
use App\Http\Requests\ListTicketsRequest;
use App\Http\Requests\ReassignTicketRequest;
use App\Http\Requests\StoreTicketReplyRequest;
use App\Http\Requests\StoreTicketRequest;
use App\Http\Requests\UpdateTicketStatusRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TicketController extends Controller
{
    public function downloadAttachment(
        DownloadTicketAttachmentRequest $request,
        DownloadTicketAttachmentHandler $downloadTicketAttachmentHandler,
        int $id,
        int $attachment,
    ): StreamedResponse {
        return $downloadTicketAttachmentHandler->handle($request->user(), $id, $attachment);
    }

    public function store(
        StoreTicketRequest $request,
        CreateTicketHandler $createTicketHandler
    ): JsonResponse {

        // Create a new ticket using the validated data
        $ticket = $createTicketHandler->handle(
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
        ListTicketsHandler $listTicketsHandler
    ): JsonResponse {
        // Get the list of tickets for the authenticated user
        $tickets = $listTicketsHandler->handle(
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
        ShowTicketHandler $showTicketHandler,
        int $id
    ): JsonResponse {
        $ticket = $showTicketHandler->handle($request->user(), $id);

        return response()->json([
            'success' => true,
            'data' => $ticket,
        ], 200);
    }

    public function claim(
        ClaimTicketRequest $request,
        ClaimTicketHandler $claimTicketHandler,
        int $id
    ): JsonResponse {

        $ticket = $claimTicketHandler->handle($request->user(), $id);

        return response()->json([
            'success' => true,
            'message' => 'Ticket claimed successfully.',
            'data' => $ticket->load('activeAssignment.agent'),
        ], 200);
    }

    public function assign(
        AssignTicketRequest $request,
        AssignTicketHandler $assignTicketHandler,
        int $id
    ): JsonResponse {

        $ticket = $assignTicketHandler->handle(
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
        ReassignTicketHandler $reassignTicketHandler,
        int $id
    ): JsonResponse {

        $validated = $request->validated();

        $ticket = $reassignTicketHandler->handle(
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
        UpdateTicketStatusHandler $updateTicketStatusHandler,
        int $id
    ): JsonResponse {

        $validated = $request->validated();

        $ticket = $updateTicketStatusHandler->handle(
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
        StoreTicketReplyHandler $storeTicketReplyHandler,
        int $id
    ): JsonResponse {

        $validated = $request->validated();

        $reply = $storeTicketReplyHandler->handle(
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
