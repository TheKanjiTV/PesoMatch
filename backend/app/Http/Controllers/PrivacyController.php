<?php

namespace App\Http\Controllers;

use App\Models\PrivacyRequest;
use App\Models\TableSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PrivacyController extends Controller
{
    public function index(Request $r)
    {
        $r->validate(['scope' => ['sometimes', Rule::in(['own', 'all'])]]);
        $q = PrivacyRequest::query();
        if ($r->query('scope') === 'all') {
            abort_unless($r->user()->role === 'admin', 403);
            $q->with('user:id,name');
        } else {
            $q->where('user_id', $r->user()->id);
        }

        return $q->latest()->orderByDesc('id')->paginate(TableSetting::perPage());
    }

    public function store(Request $r)
    {
        $data = $r->validate(['kind' => ['required', Rule::in(['access', 'correction', 'deletion', 'restriction', 'question'])], 'details' => 'nullable|string|max:2000', 'user_id' => 'prohibited', 'status' => 'prohibited', 'response' => 'prohibited']);
        $row = PrivacyRequest::create([...$data, 'reference' => (string) Str::uuid(), 'user_id' => $r->user()->id]);

        return response()->json(['data' => $row], 201);
    }

    public function update(Request $r, PrivacyRequest $privacyRequest)
    {
        abort_unless($r->user()->role === 'admin', 403);
        $data = $r->validate(['status' => ['required', Rule::in(['in_review', 'completed', 'declined'])], 'response' => 'required|string|min:10|max:2000']);

        return DB::transaction(function () use ($privacyRequest, $data, $r) {
            $row = PrivacyRequest::whereKey($privacyRequest->id)->lockForUpdate()->firstOrFail();
            abort_unless(in_array($row->status, ['requested', 'in_review'], true), 409, 'This request already has a final response.');
            $row->update($data);
            DB::table('audit_events')->insert(['actor_id' => $r->user()->id, 'action' => 'privacy.reviewed', 'entity' => $row->getTable(), 'entity_id' => $row->id, 'changes' => json_encode(['status' => $row->status]), 'created_at' => now()]);

            // A response records the review; it does not erase records or backups.
            return response()->json(['data' => $row]);
        });
    }
}
