<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;


class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'name',
        'email',
        'password',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function createTicket(): HasMany
    {
        return $this->hasMany(Ticket::class, 'customer_id');
    }

    public function agentAssignments(): HasMany
    {
        return $this->hasMany(TicketAgent::class, 'agent_id');
    }

    public function activeAssignments(): HasMany
    {
        return $this->hasMany(TicketAgent::class, 'agent_id')
            ->whereNull('unassigned_at');
    }

    public function assignmentsMade(): HasMany
    {
        return $this->hasMany(TicketAgent::class, 'assigned_by');
    }
    public function ticketReplies(): HasMany
    {
        return $this->hasMany(TicketReply::class);
    }
}
