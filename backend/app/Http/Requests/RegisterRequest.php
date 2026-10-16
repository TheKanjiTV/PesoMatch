<?php

namespace App\Http\Requests;

use App\Rules\PasswordBytes;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
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
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'confirmed', Password::min(8), new PasswordBytes],
            'mobile_number' => ['nullable', 'string', 'regex:/^\+639\d{9}$/'], 'role' => ['prohibited'], 'user_id' => ['prohibited'],
            'terms_accepted' => ['required', 'accepted'], 'website' => ['sometimes', 'nullable', 'string', 'max:0'],
        ];
    }
}
