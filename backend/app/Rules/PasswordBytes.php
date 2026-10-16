<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class PasswordBytes implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // bcrypt has a byte limit, including for multi-byte Unicode passwords.
        if (is_string($value) && strlen($value) > 72) {
            $fail('The password must not exceed 72 bytes.');
        }
    }
}
