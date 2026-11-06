<?php

namespace App\Http\Controllers;

use App\Services\VacancySourceAvailability;
use Illuminate\Http\JsonResponse;

class VacancySourceStatusController extends Controller
{
    public function __invoke(VacancySourceAvailability $source): JsonResponse
    {
        return response()->json($source->status());
    }
}
