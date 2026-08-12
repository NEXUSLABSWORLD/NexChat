<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = [
            'users',
            'password_reset_tokens',
            'sessions',
            'cache',
            'cache_locks',
            'jobs',
            'job_batches',
            'failed_jobs',
            'conversations',
            'messages',
            'personal_access_tokens',
            'groups',
            'group_members',
            'group_messages',
            'ai_saved_phrases',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                DB::statement("ALTER TABLE public.{$table} ENABLE ROW LEVEL SECURITY;");
                DB::statement("DROP POLICY IF EXISTS authenticated_access ON public.{$table};");
                DB::statement("CREATE POLICY authenticated_access ON public.{$table} FOR ALL TO authenticated USING (true);");
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'users',
            'password_reset_tokens',
            'sessions',
            'cache',
            'cache_locks',
            'jobs',
            'job_batches',
            'failed_jobs',
            'conversations',
            'messages',
            'personal_access_tokens',
            'groups',
            'group_members',
            'group_messages',
            'ai_saved_phrases',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                DB::statement("DROP POLICY IF EXISTS authenticated_access ON public.{$table};");
                DB::statement("ALTER TABLE public.{$table} DISABLE ROW LEVEL SECURITY;");
            }
        }
    }
};
