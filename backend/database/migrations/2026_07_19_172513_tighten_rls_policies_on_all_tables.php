<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tighten RLS policies: replace overly permissive "FOR ALL USING (true)"
     * with SELECT-only policies. Laravel connects as postgres (bypasses RLS),
     * so writes still work from the backend. This blocks direct writes via
     * Supabase's PostgREST API from the `authenticated` role.
     */
    public function up(): void
    {
        // All tables that currently have the permissive "authenticated_access" policy
        $allTables = [
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
            'migrations',
            // Tables from the earlier fix_rls migration
            'user_contacts',
            'user_blocks',
            'user_reports',
            'posts',
        ];

        // Internal Laravel tables: no access at all via PostgREST
        // (RLS enabled + no policy = deny all for non-superuser roles)
        $internalTables = [
            'cache',
            'cache_locks',
            'jobs',
            'job_batches',
            'failed_jobs',
            'sessions',
            'password_reset_tokens',
            'personal_access_tokens',
            'migrations',
        ];

        foreach ($allTables as $table) {
            if (!Schema::hasTable($table)) {
                continue;
            }

            // Drop the old permissive policy
            DB::statement("DROP POLICY IF EXISTS authenticated_access ON public.{$table};");

            if (in_array($table, $internalTables)) {
                // Internal tables: no policy at all = deny everything to authenticated/anon
                // Laravel (postgres role) still bypasses RLS
                continue;
            }

            // User-facing tables: allow SELECT only, deny direct writes via PostgREST
            DB::statement(
                "CREATE POLICY authenticated_select ON public.{$table} FOR SELECT TO authenticated USING (true);"
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $allTables = [
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
            'migrations',
            'user_contacts',
            'user_blocks',
            'user_reports',
            'posts',
        ];

        foreach ($allTables as $table) {
            if (!Schema::hasTable($table)) {
                continue;
            }

            // Drop the new policies
            DB::statement("DROP POLICY IF EXISTS authenticated_select ON public.{$table};");

            // Restore the old permissive policy
            DB::statement(
                "CREATE POLICY authenticated_access ON public.{$table} FOR ALL TO authenticated USING (true);"
            );
        }
    }
};
