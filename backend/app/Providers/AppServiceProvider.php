<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        RateLimiter::for('login', fn (Request $request) => [Limit::perMinute(30)->by($request->ip()), Limit::perMinute(5)->by(strtolower(is_string($request->input('email')) ? $request->input('email') : '<invalid>').'|'.$request->ip())]);
        RateLimiter::for('register', fn (Request $request) => Limit::perMinute(5)->by($request->ip()));
        RateLimiter::for('platform', fn (Request $request) => $request->isMethod('GET')
            ? Limit::perMinute(180)->by('read:'.$request->user()->id)
            : Limit::perMinute(60)->by('write:'.$request->user()->id));
    }
}
