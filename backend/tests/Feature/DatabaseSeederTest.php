<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DatabaseSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_default_seeder_does_not_create_demo_accounts(): void
    {
        $this->seed();

        $this->assertDatabaseCount('users', 0);
    }
}
