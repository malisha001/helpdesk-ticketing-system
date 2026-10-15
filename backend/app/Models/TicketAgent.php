<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketAgent extends Model
{   
    //bydefault, Eloquent assumes the table name is the plural form of the model name. Since our table name is not the plural form of the model name, we need to specify it explicitly.
    protected $table = 'agent_ticket';

    public $timestamps = false;

    protected $fillable = [
        'ticket_id',
        'agent_id',
        'assigned_by',
        'assigned_at',
        'unassigned_at',
        'reason',
    ];

    //cast is used for converting values to specific types, e.g., dates
    protected $casts = [
        'assigned_at' => 'datetime',
        'unassigned_at' => 'datetime',
    ];

    public function ticket():BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

}
