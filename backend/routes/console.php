<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('booking:expire')->everyFiveMinutes()->withoutOverlapping(10);
Schedule::command('goal:check-failed-jobs')->everyFiveMinutes()->withoutOverlapping(10);
