<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateAccountRequest;
use App\Http\Resources\UserResource;
use App\Listeners\AuthenticationActivity;
use App\Models\ResumeDocument;
use App\Models\TableSetting;
use App\Models\User;
use App\Rules\PasswordBytes;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class AccountController extends Controller
{
    public function history(Request $request): JsonResponse
    {
        $events = DB::table('audit_events')
            ->where('actor_id', $request->user()->id)
            ->where('entity', 'users')
            ->whereIn('action', AuthenticationActivity::ACTIONS)
            ->orderByDesc('id')
            ->paginate(TableSetting::perPage(), ['id', 'action', 'changes', 'created_at']);

        $events->through(function ($event) {
            $details = json_decode($event->changes, true);

            return [
                'id' => $event->id,
                'action' => $event->action,
                'created_at' => Carbon::parse($event->created_at)->toIso8601String(),
                'ip_address' => $details['ip_address'] ?? null,
                'user_agent' => $details['user_agent'] ?? null,
                'reason' => $details['reason'] ?? null,
            ];
        });

        return response()->json($events);
    }

    public function update(UpdateAccountRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();
        DB::transaction(function () use ($user, $data) {
            if ($user->email !== $data['email']) {
                $user->email_verified_at = null;
            }
            $user->fill(array_intersect_key($data, array_flip(['first_name', 'middle_name', 'last_name', 'email'])));
            $user->name = trim($user->first_name.' '.$user->last_name);
            $user->save();
            $user->jobseekerProfile()->update(['mobile_number' => $data['mobile_number']]);
        });

        return response()->json(['message' => 'Account information updated.', 'user' => (new UserResource($user))->resolve()]);
    }

    public function password(Request $request): JsonResponse
    {
        $data = $request->validate(['current_password' => ['bail', 'required', 'string', 'current_password:web'], 'password' => ['required', 'string', 'confirmed', Password::min(8), new PasswordBytes]]);
        $request->user()->update(['password' => $data['password'], 'remember_token' => null]);
        DB::table('sessions')->where('user_id', $request->user()->id)->where('id', '!=', $request->session()->getId())->delete();
        $request->session()->regenerate(true);

        return response()->json(['message' => 'Password updated. Other sessions have been signed out.']);
    }

    public function destroy(Request $request): JsonResponse
    {
        $request->validate(['current_password' => ['bail', 'required', 'string', 'current_password:web']]);
        $user = $request->user();
        // Log out while the model still exists: rotating a remember token after deletion
        // would make Eloquent save the deleted model as a new account.
        abort_if($user->role === 'admin' && User::where('role', 'admin')->count() <= 1, 422, 'Assign another administrator before deleting your account.');
        Auth::guard('web')->logout();
        DB::transaction(function () use ($user) {
            DB::table('sessions')->where('user_id', $user->id)->delete();
            $resume = ResumeDocument::where('user_id', $user->id)->first();
            if ($resume) {
                abort_unless(Storage::disk('local')->delete($resume->path), 503, 'Your document could not be removed. Please try again or contact the operator.');
            }
            DB::table('ai_embeddings')->where('source_type', 'profile')->where('source_id', $user->id)->delete();
            $user->delete();
        });
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Account deleted.']);
    }
}
