<?php

namespace Database\Seeders;

use App\Models\ServiceEvent;
use App\Models\TrainingProgram;
use App\Models\Vacancy;
use Illuminate\Database\Seeder;

/** Opt-in fictional catalog. Never creates accounts, applications or outcomes. */
class EmploymentSampleSeeder extends Seeder
{
    public function run(): void
    {
        $jobs = [
            ['Customer Service Associate', 'Sample Bay Services', 'Customer service', ['Communication', 'Customer Service', 'Computer Literacy']],
            ['Office & Records Assistant', 'Sample Civic Cooperative', 'Administration', ['Microsoft Word', 'Microsoft Excel', 'Data Entry']],
            ['Junior Bookkeeping Assistant', 'Sample Island Enterprise', 'Finance', ['Bookkeeping', 'Microsoft Excel']],
            ['Digital Content Assistant', 'Sample Local Creative Studio', 'Creative services', ['Graphic Design', 'Social Media Management', 'Communication']],
        ];
        foreach ($jobs as [$title, $org, $industry, $skills]) {
            Vacancy::firstOrCreate(['title' => $title, 'organization' => $org, 'is_sample' => true], ['location' => 'Calapan City', 'industry' => $industry, 'employment_type' => 'Full-time', 'description' => 'Fictional vacancy for evaluating PESO referral and placement workflows. Applicants support daily operations, collaborate with a team, and maintain accurate service records. Required skills are listed below. This is not an actual hiring advertisement.', 'skills' => $skills, 'slots' => 3, 'salary_min' => 14000, 'salary_max' => 18000, 'deadline' => today()->addDays(90)->toDateString(), 'status' => 'published']);
        }
        foreach ([['Digital Workplace Essentials', ['Computer Literacy', 'Microsoft Word', 'Microsoft Excel', 'Data Entry']], ['Customer Service & Work Readiness', ['Communication', 'Customer Service']], ['Bookkeeping Foundations', ['Bookkeeping', 'Microsoft Excel']]] as [$title, $skills]) {
            TrainingProgram::firstOrCreate(['title' => $title, 'is_sample' => true], ['provider' => 'Sample Community Skills Center', 'location' => 'Calapan City', 'mode' => 'Blended', 'description' => 'Fictional community upskilling program for testing enrollment, attendance progress and completion tracking. Not a TESDA-registered offering or scholarship.', 'requirements' => 'Updated jobseeker profile. Provider checks eligibility and documents before confirming a place.', 'skills' => $skills, 'capacity' => 20, 'starts_on' => today()->addDays(30)->toDateString(), 'ends_on' => today()->addDays(60)->toDateString(), 'schedule' => 'Monday to Friday, 9 AM–12 PM', 'fee' => 0, 'status' => 'published']);
        }
        ServiceEvent::firstOrCreate(['title' => 'Community employment orientation — sample', 'is_sample' => true], ['type' => 'Pre-employment orientation', 'location' => 'Sample PESO service desk', 'starts_at' => now()->addWeeks(2), 'description' => 'Fictional event for exploring career guidance and employment preparation services.', 'status' => 'published']);
    }
}
