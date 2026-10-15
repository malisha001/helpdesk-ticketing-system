<?php

namespace App\Models;

use App\Models\TicketAgent;
use App\Models\TicketHistory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Ticket extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'subject',
        'description',
        'priority',
        'status',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function replies():HasMany
    {
        return $this->hasMany(TicketReply::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(TicketAgent::class);
    }

    public function activeAssignment(): HasOne
    {
        return $this->hasOne(TicketAgent::class,'ticket_id')
        //Only return rows where the unassigned_at column is NULL.
        ->whereNull('unassigned_at');
    }

    public function history(): HasMany
    {
        return $this->hasMany(TicketHistory::class,'ticket_id');
    }
}
