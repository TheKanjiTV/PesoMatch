<?php

use Illuminate\Support\Facades\Route;

// Version 1 is canonical. Keep existing clients working through compatibility routes.
Route::prefix('v1')->group(__DIR__.'/api-v1.php');
Route::group([], __DIR__.'/api-v1.php');
