<?php

namespace App\Http\Requests;

use App\Rules\PasswordBytes;
use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
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
    }

    public function rules(): array
    {
        return ['email' => ['required', 'string', 'email', 'max:255'], 'password' => ['required', 'string', new PasswordBytes], 'remember' => ['sometimes', 'boolean'], 'website' => ['sometimes', 'nullable', 'string', 'max:0']];
    }
}
