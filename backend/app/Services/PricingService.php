<?php

namespace App\Services;

use App\Models\Field;
use App\Models\FieldPrice;
use Illuminate\Support\Collection;

class PricingService
{
    /**
     * Determine the price for a slot based on the configured price rules.
     *
     * A rule covers the slot when the whole slot [start_time, end_time]
     * fits inside the rule range. Falls back to the field's price_per_hour
     * when no rule covers the slot.
     */
    public function priceForSlot(Field $field, string $startTime, string $endTime, ?Collection $prices = null): ?int
    {
        $rules = $prices ?? $field->prices;

        foreach ($rules as $rule) {
            if ($this->covers($rule, $startTime, $endTime)) {
                return $rule->price;
            }
        }

        return $field->price_per_hour;
    }

    private function covers(FieldPrice $rule, string $startTime, string $endTime): bool
    {
        $ruleStart = substr((string) $rule->start_time, 0, 5);
        $ruleEnd = substr((string) $rule->end_time, 0, 5);

        return $startTime >= $ruleStart && $endTime <= $ruleEnd;
    }
}
