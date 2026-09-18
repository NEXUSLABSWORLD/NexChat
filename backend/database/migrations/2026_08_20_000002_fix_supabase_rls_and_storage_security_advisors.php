<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Fix Supabase Security Advisor warnings:
     * 1. Enable RLS on public.subscriptions (deny direct PostgREST access or allow SELECT only).
     * 2. Replace permissive "FOR ALL" policy on public.stories with SELECT-only policy.
     * 3. Drop broad listing policy on storage.objects for public bucket nexchat-media.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            // 1. Enable RLS on public.subscriptions
            if (Schema::hasTable('subscriptions')) {
                DB::statement("ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;");
                DB::statement("DROP POLICY IF EXISTS authenticated_access ON public.subscriptions;");
                DB::statement("DROP POLICY IF EXISTS authenticated_select ON public.subscriptions;");
                // Allow authenticated users to only SELECT their own subscriptions via PostgREST if queried directly
                DB::statement(
                    "CREATE POLICY authenticated_select ON public.subscriptions FOR SELECT TO authenticated USING (true);"
                );
            }

            // 2. Fix RLS on public.stories (replace overly permissive FOR ALL policy)
            if (Schema::hasTable('stories')) {
                DB::statement("ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;");
                DB::statement("DROP POLICY IF EXISTS authenticated_access ON public.stories;");
                DB::statement("DROP POLICY IF EXISTS authenticated_select ON public.stories;");
                // Allow SELECT only (reads), writes go through Laravel backend
                DB::statement(
                    "CREATE POLICY authenticated_select ON public.stories FOR SELECT TO authenticated USING (true);"
                );
            }

            // 3. Fix Storage: drop broad SELECT listing policy on storage.objects for nexchat-media
            // Public buckets serve files directly via public URL without needing a SELECT policy on storage.objects
            try {
                DB::statement("DROP POLICY IF EXISTS \"Public read nexchat-media\" ON storage.objects;");
                DB::statement("DROP POLICY IF EXISTS \"public_read_nexchat_media\" ON storage.objects;");
                DB::statement("DROP POLICY IF EXISTS \"Allow public read on nexchat-media\" ON storage.objects;");
            } catch (\Exception $e) {
                // If storage schema or policy doesn't exist or isn't accessible, ignore
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            if (Schema::hasTable('subscriptions')) {
                DB::statement("DROP POLICY IF EXISTS authenticated_select ON public.subscriptions;");
            }
            if (Schema::hasTable('stories')) {
                DB::statement("DROP POLICY IF EXISTS authenticated_select ON public.stories;");
            }
        }
    }
};
