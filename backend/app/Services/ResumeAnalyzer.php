<?php

namespace App\Services;

use App\Models\Skill;
use Illuminate\Validation\ValidationException;
use Symfony\Component\Process\Process;

class ResumeAnalyzer
{
    public function extract(string $path): string
    {
        $handle = fopen($path, 'rb');
        $header = $handle ? fread($handle, 8) : '';
        if ($handle) {
            fclose($handle);
        }
        if (! str_starts_with($header, '%PDF-')) {
            throw ValidationException::withMessages(['resume' => ['Upload a valid PDF document.']]);
        }
        $process = new Process([config('services.resume.pdftotext'), '-f', '1', '-l', '20', '-layout', '-enc', 'UTF-8', $path, '-']);
        $process->setTimeout(20);
        $process->disableOutput();
        $text = '';
        try {
            $process->run(function ($type, $chunk) use (&$text) {
                if ($type !== Process::OUT) {
                    return;
                }
                if (strlen($text) + strlen($chunk) > 800000) {
                    throw new \LengthException('Extraction output limit.');
                }
                $text .= $chunk;
            });
        } catch (\LengthException $e) {
            $process->stop(0);
            throw ValidationException::withMessages(['resume' => ['This document contains too much text. Upload a shorter résumé.']]);
        } catch (\Throwable $e) {
            $process->stop(0);
            throw ValidationException::withMessages(['resume' => ['PDF extraction is unavailable. Please try again or enter your profile manually.']]);
        }
        if (! $process->isSuccessful()) {
            throw ValidationException::withMessages(['resume' => ['This PDF cannot be read. Upload an unlocked PDF with selectable text.']]);
        }
        $text = trim($text);
        if (mb_strlen($text) < 40) {
            throw ValidationException::withMessages(['resume' => ['No readable text was detected. Scanned/image PDFs need OCR first. Upload a PDF with selectable text.']]);
        }
        if (mb_strlen($text) > 200000) {
            throw ValidationException::withMessages(['resume' => ['This document contains too much text. Upload a shorter resume (first 20 pages are read).']]);
        }

        return $text;
    }

    public function analyze(string $text): array
    {
        $aliases = ['Microsoft Excel' => ['excel', 'spreadsheets'], 'Microsoft Word' => ['ms word', 'microsoft word', 'word processing'], 'Programming' => ['programming', 'javascript', 'typescript', 'python', 'php', 'laravel', 'react', 'java', 'c++'], 'Computer Literacy' => ['computer literacy', 'digital literacy', 'computer proficient'], 'Communication' => ['communication', 'communicating', 'public speaking'], 'Graphic Design' => ['graphic design', 'photoshop', 'illustrator', 'canva'], 'Customer Service' => ['customer service', 'customer support', 'client support'], 'Bookkeeping' => ['bookkeeping', 'bookkeeper', 'accounts payable', 'accounts receivable'], 'Social Media Management' => ['social media management', 'social media marketing', 'content creation']];
        $skills = [];
        foreach (Skill::all(['id', 'name']) as $skill) {
            foreach (array_unique(array_merge([$skill->name], $aliases[$skill->name] ?? [])) as $term) {
                if (preg_match('/(?<![\pL\pN])'.preg_quote($term, '/').'(?![\pL\pN])/iu', $text, $match, PREG_OFFSET_CAPTURE)) {
                    $offset = $match[0][1];
                    $start = strrpos(substr($text, 0, $offset), "\n");
                    $start = $start === false ? 0 : $start + 1;
                    $end = strpos($text, "\n", $offset);
                    $line = trim(substr($text, $start, ($end === false ? strlen($text) : $end) - $start));
                    if (preg_match('/\b(no|without|lack(?:ing)?|not familiar|not proficient)\b.{0,30}'.preg_quote($term, '/').'/iu', $line)) {
                        continue;
                    }
                    $skills[] = ['id' => $skill->id, 'name' => $skill->name, 'evidence' => mb_substr($line, 0, 240)];
                    break;
                }
            }
        }
        preg_match('/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i', $text, $email);
        preg_match('/(?:\+?63[\s\-]?|0)9(?:[\s\-]?\d){9}\b/', $text, $phone);
        $mobile = preg_replace('/\D/', '', $phone[0] ?? '');
        if (str_starts_with($mobile, '09')) {
            $mobile = '63'.substr($mobile, 1);
        } if ($mobile) {
            $mobile = '+'.$mobile;
        }
        preg_match('/(?:education|academic background)\s*[:\n]?(.{0,900}?)(?=\n\s*(?:skills|experience|employment|certifications|references)|\z)/isu', $text, $education);
        preg_match('/(?:work experience|employment history|professional experience)\s*[:\n]?(.{0,1400}?)(?=\n\s*(?:education|skills|certifications|references)|\z)/isu', $text, $experience);

        return ['skills' => $skills, 'email' => $email[0] ?? null, 'mobile_number' => $mobile ?: null, 'education_excerpt' => trim($education[1] ?? ''), 'experience_excerpt' => trim($experience[1] ?? ''), 'method' => 'local-pdf-text-skill-evidence-v1', 'note' => 'Detected mentions are suggestions, not verified proficiency. Review before adding them. No resume is sent to an external AI service.'];
    }
}
