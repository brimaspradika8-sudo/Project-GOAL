<?php

namespace App\Services;

class SlotGeneratorService
{
    /**
     * Generate bookable slot times inside operating hours.
     *
     * Example: open 07:00, close 12:00, session 60, buffer 30
     * Output:  07:00-08:00, 08:30-09:30, 10:00-11:00
     *
     * @return array<int, array{start_time: string, end_time: string}>
     */
    public function generate(string $openTime, string $closeTime, int $sessionMinutes, int $bufferMinutes = 0): array
    {
        $open = $this->toMinutes($openTime);
        $close = $this->toMinutes($closeTime);

        if ($close <= $open || $sessionMinutes <= 0) {
            return [];
        }

        $slots = [];
        $cursor = $open;

        while ($cursor + $sessionMinutes <= $close) {
            $slots[] = [
                'start_time' => $this->toTime($cursor),
                'end_time' => $this->toTime($cursor + $sessionMinutes),
            ];
            $cursor += $sessionMinutes + $bufferMinutes;
        }

        return $slots;
    }

    public function toMinutes(string $time): int
    {
        [$hours, $minutes] = array_map('intval', explode(':', $time));

        return ($hours * 60) + $minutes;
    }

    public function toTime(int $minutes): string
    {
        return sprintf('%02d:%02d', intdiv($minutes, 60), $minutes % 60);
    }
}
