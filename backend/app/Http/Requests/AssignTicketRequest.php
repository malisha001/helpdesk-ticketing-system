<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

class AssignTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null
            && $user->hasRole(UserRole::Administrator->value)
            && $user->can('assign-ticket');
    }

    public function rules(): array
    {
        return [
            'agent_id' => [
                'required',
                'integer',
                'min:1',
            ],
        ];
    }
}
