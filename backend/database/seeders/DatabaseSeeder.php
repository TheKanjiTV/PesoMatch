<?php

namespace Database\Seeders;

use App\Models\Skill;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['Communication', 'Customer Service', 'Microsoft Word', 'Microsoft Excel', 'Computer Literacy', 'Graphic Design', 'Bookkeeping', 'Programming', 'Sales', 'Data Entry', 'Social Media Management'] as $name) {
            Skill::firstOrCreate(['name' => $name]);
        }
    }
}
