<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['email_verified_at' => $this->email_verified_at?->toIso8601String(), 'created_at' => $this->created_at?->toIso8601String(), 'id' => $this->id, 'name' => $this->name, 'first_name' => $this->first_name, 'middle_name' => $this->middle_name, 'last_name' => $this->last_name, 'email' => $this->email, 'role' => $this->role, 'dashboard_tour_completed_at' => $this->dashboard_tour_completed_at?->toIso8601String()];
    }
}
