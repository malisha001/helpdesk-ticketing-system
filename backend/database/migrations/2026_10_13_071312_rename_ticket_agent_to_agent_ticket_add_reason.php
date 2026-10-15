<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::rename('ticket_agent', 'agent_ticket');

        Schema::table('agent_ticket', function (Blueprint $table) {
            $table->text('reason')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('agent_ticket', function (Blueprint $table) {
            $table->dropColumn('reason');
        });

        Schema::rename('agent_ticket', 'ticket_agent');
    }
};