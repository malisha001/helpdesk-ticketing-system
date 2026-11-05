<?php

namespace App\Http\Requests;

use App\Enums\TicketStatus;
use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTicketStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user || ! $user->hasRole(UserRole::SupportAgent->value)) {
            return false;
        }

        if (! $user->can('change-ticket-status')) {
            return false;
        }

        // Resolving requires an additional permission
        if (
            $this->input('status') === TicketStatus::Resolved->value &&
            ! $user->can('resolve-ticket')
        ) {
            return false;
        }

        return true;
    }

    public function rules(): array
    {
        return [
            'status' => [
                'required',
                'string',
                Rule::enum(TicketStatus::class),
            ],
        ];
    }
}
