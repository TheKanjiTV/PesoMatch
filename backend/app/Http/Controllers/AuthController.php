<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Listeners\AuthenticationActivity;
use App\Models\User;
use App\Services\AuthenticationSessions;
use App\Services\LoginAttempts;
use App\Services\OnboardingService;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    public function __construct(private OnboardingService $onboarding) {}

    private function response(User $user, int $status = 200): JsonResponse
    {
        return response()->json(['user' => (new UserResource($user))->resolve(), 'onboarding' => $user->role === 'jobseeker' ? $this->onboarding->profile($user)->onboarding() : ['completed' => true, 'current_step' => 5]], $status);
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = DB::transaction(function () use ($data) {
            $user = User::create(['first_name' => $data['first_name'], 'middle_name' => $data['middle_name'] ?? null, 'last_name' => $data['last_name'], 'name' => trim($data['first_name'].' '.$data['last_name']), 'email' => $data['email'], 'password' => $data['password']]);
            $user->forceFill(['terms_accepted_at' => now(), 'terms_version' => config('security.notice_version'), 'privacy_notice_version' => config('security.notice_version')])->save();
            $user->jobseekerProfile()->create(['mobile_number' => $data['mobile_number'] ?? null]);
            app(AuthenticationActivity::class)->record($user, 'auth.registered');

            return $user;
        });

        return $this->response($user, 201);
    }

    public function login(LoginRequest $request, LoginAttempts $attempts): JsonResponse
    {
        $guard = Auth::guard('web');
        $previousUser = $guard->user();
        $previousHash = app(AuthenticationSessions::class)->hash($request->session()->getId());
        $guard->setRememberDuration(config('security.remember_minutes'));

        try {
            $failure = $attempts->attempt(
                $request->validated('email'),
                fn () => $guard->attempt($request->only('email', 'password'), $request->boolean('remember')),
            );
        } catch (LockTimeoutException) {
            app(AuthenticationActivity::class)->attempt('auth.login_busy', $request->input('email'));

            return response()->json(['message' => 'Sign-in is busy. Please try again shortly.'], 429)
                ->header('Retry-After', '3');
        }

        if (isset($failure['retry_after'])) {
            return response()->json(['message' => 'Too many failed login attempts.'] + $failure, 429)
                ->header('Retry-After', (string) $failure['retry_after']);
        }

        if ($failure !== null) {
            $message = 'The email or password is incorrect.';

            return response()->json(['message' => $message, 'errors' => ['email' => [$message]]] + $failure, 422);
        }

        $request->session()->regenerate();

        if ($previousUser && $previousUser->id !== $guard->user()->id) {
            app(AuthenticationSessions::class)->endHash($previousHash, 'account_switched');
            app(AuthenticationActivity::class)->record($previousUser, 'auth.logout', ['reason' => 'account_switched']);
        }

        return $this->response($guard->user());
    }

    public function user(Request $request): JsonResponse
    {
        return $this->response($request->user());
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Signed out.']);
    }

    public function preferences(Request $request): JsonResponse
    {
        $request->validate(['dashboard_tour_completed' => ['required', 'accepted']]);
        $user = $request->user();
        if ($user->dashboard_tour_completed_at === null) {
            $user->dashboard_tour_completed_at = now();
            $user->save();
        }

        return $this->response($user);
    }
}
