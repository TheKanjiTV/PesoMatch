<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\OnboardingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

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

            return $user;
        });

        return $this->response($user, 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        Auth::guard('web')->setRememberDuration(config('security.remember_minutes'));
        if (! Auth::guard('web')->attempt($request->only('email', 'password'), $request->boolean('remember'))) {
            throw ValidationException::withMessages(['email' => ['The email or password is incorrect.']]);
        }
        $request->session()->regenerate();

        return $this->response(Auth::guard('web')->user());
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
