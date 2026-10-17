<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreTicketReplyRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if (!$user) {
            return false;
        }

        return (
            $user->hasAnyRole(['customer', 'support_agent'])
            && $user->can('reply-to-ticket')
        );
    }

    public function rules(): array
    {
        return [
            'message' => [
                'required',
                'string',
                'max:5000',
            ],
        ];
    }
}
