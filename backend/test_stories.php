<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    // Enable RLS on stories table
    DB::statement("ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;");
    DB::statement("DROP POLICY IF EXISTS authenticated_access ON public.stories;");
    DB::statement("CREATE POLICY authenticated_access ON public.stories FOR ALL TO authenticated USING (true);");
    echo "RLS enabled on stories table successfully!\n";

    // Test inserting a story
    $storyId = DB::table('stories')->insertGetId([
        'user_id' => 1,
        'text_content' => 'Test story',
        'created_at' => now(),
        'expires_at' => now()->addHours(24),
    ]);
    echo "Story created with ID: $storyId\n";

    // Clean up test
    DB::table('stories')->where('id', $storyId)->delete();
    echo "Test story cleaned up.\n";

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
