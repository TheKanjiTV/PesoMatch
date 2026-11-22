<?php

namespace App\Providers;

use App\Listeners\AuthenticationActivity;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Event::listen(Login::class, [AuthenticationActivity::class, 'login']);
        Event::listen(Logout::class, [AuthenticationActivity::class, 'logout']);
        Event::listen(Failed::class, [AuthenticationActivity::class, 'failed']);

        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(30)->by($request->ip()));
        RateLimiter::for('register', fn (Request $request) => Limit::perMinute(5)->by($request->ip()));
        RateLimiter::for('platform', fn (Request $request) => in_array($request->method(), ['GET', 'HEAD'], true)
            ? Limit::perMinute(180)->by('read:'.$request->user()->id)
            : Limit::perMinute(60)->by('write:'.$request->user()->id));
    }
}
