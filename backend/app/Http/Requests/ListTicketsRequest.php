<?php

namespace App\Http\Requests;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListTicketsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user) {
            return false;
        }
        if ($user->hasRole(UserRole::Customer->value)) {
            return $user->can('view-own-ticket');
        }
        if ($user->hasRole(UserRole::SupportAgent->value)) {
            return $user->can('view-unassigned-ticket') || $user->can('view-assigned-ticket');
        }
        if ($user->hasRole(UserRole::Administrator->value)) {
            return $user->can('view-all-ticket');
        }

        return false;
    }

    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'nullable', 'string', 'max:255'],

            'status' => [
                'sometimes',
                'nullable',
                Rule::enum(TicketStatus::class),
            ],

            'priority' => [
                'sometimes',
                'nullable',
                Rule::enum(TicketPriority::class),
            ],

            'page' => [
                'sometimes',
                'integer',
                'min:1',
            ],

            'per_page' => [
                'sometimes',
                'integer',
                'min:1',
                'max:50',
            ],

        ];
    }
}
