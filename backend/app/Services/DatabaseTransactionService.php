<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class DatabaseTransactionService
{
    public function run(callable $callback): mixed
    {
        return DB::transaction($callback);
    }
}
