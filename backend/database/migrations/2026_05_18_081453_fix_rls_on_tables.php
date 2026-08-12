<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = ['user_contacts', 'user_blocks', 'user_reports', 'posts', 'post_likes', 'stories'];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                // Enable RLS
                DB::statement("ALTER TABLE public.$table ENABLE ROW LEVEL SECURITY;");
                
                // Drop existing policies if any (to avoid duplicates)
                DB::statement("DROP POLICY IF EXISTS authenticated_access ON public.$table;");
                
                // Create permissive policy for authenticated users
                DB::statement("CREATE POLICY authenticated_access ON public.$table FOR ALL TO authenticated USING (true);");
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = ['user_contacts', 'user_blocks', 'user_reports', 'posts', 'post_likes', 'stories'];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                DB::statement("DROP POLICY IF EXISTS authenticated_access ON public.$table;");
                DB::statement("ALTER TABLE public.$table DISABLE ROW LEVEL SECURITY;");
            }
        }
    }
};
