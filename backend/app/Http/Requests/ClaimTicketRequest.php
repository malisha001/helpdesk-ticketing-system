<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

class ClaimTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user) {
            return false;
        }

        return $user->hasRole(UserRole::SupportAgent->value)
            && $user->can('claim-ticket');
    }

    public function rules(): array
    {
        return [];
    }
}
