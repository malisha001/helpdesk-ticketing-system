<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ClaimTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if(!$user)
        {
            return false;
        }

        return $user->hasRole('support_agent') 
            && $user->can('claim-ticket');
    }

    public function rules(): array
    {
        return [];
    }
}
