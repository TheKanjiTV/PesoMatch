<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmploymentController as Employment;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\PrivacyController;
use App\Http\Controllers\RemovalController;
use App\Http\Controllers\ResumeController;
use App\Http\Middleware\EnsureSessionIdentity;
use App\Http\Middleware\ValidatePlatformQuery;
use App\Models\Skill;
use Illuminate\Support\Facades\Route;

Route::get('/public/catalog', [Employment::class, 'publicCatalog'])->middleware('throttle:60,1');
Route::get('/public/source-coverage', fn () => response()->json(json_decode(file_get_contents(database_path('data/catalog-source-coverage.json')), true, 512, JSON_THROW_ON_ERROR)))->middleware('throttle:60,1');

Route::prefix('platform')->middleware(['auth:sanctum', EnsureSessionIdentity::class, 'throttle:platform', ValidatePlatformQuery::class])->group(function () {
    Route::post('/delete-intents', [RemovalController::class, 'intent']);
    Route::delete('/remove/{type}/{id}', [RemovalController::class, 'destroy'])->whereNumber('id');
    Route::get('/summary', [Employment::class, 'summary']);
    Route::get('/vacancies', [Employment::class, 'vacancies']);
    Route::get('/employers', [Employment::class, 'employers']);
    Route::post('/vacancies', [Employment::class, 'saveVacancy']);
    Route::patch('/vacancies/{vacancy}', [Employment::class, 'saveVacancy']);
    Route::post('/vacancies/{vacancy}/save', [Employment::class, 'bookmark']);
    Route::delete('/vacancies/{vacancy}/save', [Employment::class, 'bookmark']);
    Route::post('/vacancies/{vacancy}/referrals', [Employment::class, 'requestReferral']);
    Route::get('/training', [Employment::class, 'programs']);
    Route::post('/training', [Employment::class, 'saveProgram']);
    Route::patch('/training/{program}', [Employment::class, 'saveProgram']);
    Route::post('/training/{program}/enroll', [Employment::class, 'enroll']);
    Route::post('/training/{program}/intakes', [Employment::class, 'createIntake']);
    Route::get('/matches', [Employment::class, 'matches']);
    Route::get('/referrals', [Employment::class, 'referrals']);
    Route::patch('/referrals/{referral}', [Employment::class, 'updateReferral']);
    Route::post('/referrals/{referral}/placement', [Employment::class, 'place']);
    Route::get('/enrollments', [Employment::class, 'enrollments']);
    Route::patch('/enrollments/{enrollment}', [Employment::class, 'updateEnrollment']);
    Route::get('/placements', [Employment::class, 'placements']);
    Route::get('/outcomes', [Employment::class, 'outcomes']);
    Route::post('/outcomes', [Employment::class, 'reportOutcome']);
    Route::patch('/outcomes/{outcome}/verify', [Employment::class, 'verifyOutcome']);
    Route::get('/services', [Employment::class, 'services']);
    Route::post('/services', [Employment::class, 'requestService']);
    Route::patch('/services/{service}', [Employment::class, 'updateService']);
    Route::get('/events', [Employment::class, 'events']);
    Route::post('/events', [Employment::class, 'saveEvent']);
    Route::patch('/events/{event}', [Employment::class, 'saveEvent']);
    Route::get('/jobseekers', [Employment::class, 'registry']);
    Route::get('/users', [Employment::class, 'users']);
    Route::patch('/users/{user}/role', [Employment::class, 'role']);
    Route::get('/audit', [Employment::class, 'auditLog']);
    Route::get('/labor-market', [Employment::class, 'laborMarket']);
});

Route::middleware(['auth:sanctum', EnsureSessionIdentity::class, 'throttle:platform'])->group(function () {
    Route::get('/privacy/requests', [PrivacyController::class, 'index'])->middleware(ValidatePlatformQuery::class);
    Route::post('/privacy/requests', [PrivacyController::class, 'store'])->middleware('throttle:6,1');
    Route::patch('/privacy/requests/{privacyRequest}', [PrivacyController::class, 'update'])->middleware('throttle:30,1');
    Route::patch('/auth/account', [AccountController::class, 'update'])->middleware('throttle:6,1');
    Route::patch('/auth/password', [AccountController::class, 'password'])->middleware('throttle:6,1');
    Route::delete('/auth/account', [AccountController::class, 'destroy'])->middleware('throttle:6,1');
    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::patch('/auth/preferences', [AuthController::class, 'preferences']);
    Route::get('/skills', fn () => response()->json(['data' => Skill::orderBy('id')->get(['id', 'name'])]));
    Route::prefix('jobseeker')->middleware('jobseeker')->group(function () {
        Route::get('/onboarding', [OnboardingController::class, 'show']);
        Route::patch('/onboarding/{section}', [OnboardingController::class, 'update'])->where('section', 'personal|education|skills|work-experience|preferences');
        Route::post('/onboarding/complete', [OnboardingController::class, 'complete']);
        Route::get('/resume', [ResumeController::class, 'show']);
        Route::post('/resume', [ResumeController::class, 'upload'])->middleware('throttle:10,1');
        Route::post('/resume/apply', [ResumeController::class, 'apply']);
        Route::get('/resume/download', [ResumeController::class, 'download']);
        Route::delete('/resume', [ResumeController::class, 'destroy']);
        Route::get('/profile', [OnboardingController::class, 'show']);
        Route::patch('/profile', [OnboardingController::class, 'update']);
    });
});
