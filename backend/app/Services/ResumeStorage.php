<?php

namespace App\Services;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ResumeStorage
{
    private const PREFIX = "PESO-ENCRYPTED-RESUME-V1\n";

    public function store(int $userId, string $bytes): string
    {
        $path = 'resumes/'.$userId.'/'.Str::random(40).'.enc';
        if (! Storage::disk('local')->put($path, self::PREFIX.Crypt::encryptString($bytes))) {
            throw new \RuntimeException('Private document storage is unavailable.');
        }

        return $path;
    }

    public function read(string $path): string
    {
        $data = Storage::disk('local')->get($path);
        abort_if($data === null, 404);
        // Backward-compatible read: do not bulk rewrite/delete existing files.
        if (str_starts_with($data, self::PREFIX)) {
            return Crypt::decryptString(substr($data, strlen(self::PREFIX)));
        }
        abort_if(str_ends_with($path, '.enc'), 422, 'The document is unreadable.');
        abort_unless(str_starts_with($data, '%PDF-'), 422, 'The document is unreadable.');

        return $data;
    }
}
