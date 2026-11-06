<?php

namespace Tests\Feature;

use App\Services\VacancySourceAvailability;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class VacancySourceAvailabilityTest extends TestCase
{
    public function test_unavailable_source_is_reported_and_cached_without_touching_catalog_records(): void
    {
        Http::preventStrayRequests();
        Http::fake([VacancySourceAvailability::URL => Http::response('<title>Web App - Unavailable</title>', 403)]);
        $response = $this->getJson('/api/public/vacancy-source-status')->assertOk()->assertJsonPath('status', 'unavailable')->assertJsonPath('http_status', 403)->assertJsonPath('url', VacancySourceAvailability::URL);
        $this->assertNotNull($response->json('checked_at'));
        $this->getJson('/api/public/vacancy-source-status')->assertOk()->assertExactJson($response->json());
        Http::assertSentCount(1);
    }

    public function test_real_catalog_marker_is_required_and_soft_404_is_not_marked_reachable(): void
    {
        Http::fake([VacancySourceAvailability::URL => Http::sequence()
            ->push('<title>PhilJobNet | Job vacancies</title><h1>Find jobs here</h1>', 200)
            ->push('<title>404 Page not found</title>', 200)]);
        $this->getJson('/api/public/vacancy-source-status')->assertOk()->assertJsonPath('status', 'reachable');
        Cache::flush();
        $this->getJson('/api/public/vacancy-source-status')->assertOk()->assertJsonPath('status', 'unavailable');
    }

    public function test_network_errors_are_inconclusive_and_never_leak_diagnostics(): void
    {
        Http::fake([VacancySourceAvailability::URL => Http::failedConnection('private transport diagnostic')]);
        $this->getJson('/api/public/vacancy-source-status')->assertOk()->assertJsonPath('status', 'unknown')->assertJsonPath('http_status', null)->assertDontSee('private transport diagnostic');
    }

    public function test_redirects_are_not_followed_and_destination_query_parameters_are_ignored(): void
    {
        Http::fake([VacancySourceAvailability::URL => Http::response('', 302, ['Location' => 'http://127.0.0.1/private'])]);
        $this->getJson('/api/public/vacancy-source-status?url=http://127.0.0.1/private')->assertOk()->assertJsonPath('status', 'unknown')->assertJsonPath('http_status', 302);
        Http::assertSent(fn ($request) => $request->url() === VacancySourceAvailability::URL);
        Http::assertSentCount(1);
    }
}
