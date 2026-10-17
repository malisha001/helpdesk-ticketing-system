<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTicketStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if (!$user || !$user->hasRole('support_agent')) {
            return false;
        }

        if (!$user->can('change-ticket-status')) {
            return false;
        }

        // Resolving requires an additional permission
        if (
            $this->input('status') === 'resolved' &&
            !$user->can('resolve-ticket')
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
                Rule::in([
                    'open',
                    'in_progress',
                    'waiting_for_customer',
                    'resolved',
                ]),
            ],
        ];
    }
}
