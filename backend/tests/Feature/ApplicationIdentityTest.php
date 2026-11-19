<?php

namespace Tests\Feature;

use Tests\TestCase;

class ApplicationIdentityTest extends TestCase
{
    public function test_public_health_identifies_the_application_without_private_details(): void
    {
        $response = $this->getJson('/api/public/health')->assertOk()
            ->assertExactJson(['application' => 'pesomatch', 'status' => 'ok']);
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
    }

    public function test_session_route_exists_and_requires_authentication(): void
    {
        $this->getJson('/api/auth/user')->assertUnauthorized();
    }
}
