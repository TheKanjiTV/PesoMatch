<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => strtolower(trim($this->input('email')))]);
        }
        if (is_string($this->input('mobile_number'))) {
            $this->merge(['mobile_number' => SaveOnboardingRequest::normalizePhone($this->input('mobile_number'))]);
        }
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'], 'middle_name' => ['nullable', 'string', 'max:100'], 'last_name' => ['required', 'string', 'max:100'],
            'email' => ['bail', 'required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($this->user()->id)],
            'mobile_number' => ['required', 'string', 'regex:/^\+639\d{9}$/'], 'current_password' => ['bail', 'required', 'string', 'current_password:web'],
            'user_id' => ['prohibited'], 'role' => ['prohibited'], 'email_verified_at' => ['prohibited'],
        ];
    }
}
