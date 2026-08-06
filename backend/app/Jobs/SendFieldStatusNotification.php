<?php

namespace App\Jobs;

use App\Mail\FieldStatusMail;
use App\Models\Field;
use App\Models\Notification;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendFieldStatusNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public int $fieldId,
        public int $ownerId,
        public string $status,
        public ?string $reason = null,
    ) {}

    public function handle(NotificationService $notifications): void
    {
        $field = Field::with('owner:id,name,email')->find($this->fieldId);
        $owner = User::find($this->ownerId);

        if (!$field || !$owner) {
            return;
        }

        $approved = $this->status === 'approved';

        $notifications->create(
            $owner,
            $approved ? Notification::TYPE_FIELD_APPROVED : Notification::TYPE_FIELD_REJECTED,
            $approved ? 'Lapangan Disetujui' : 'Lapangan Ditolak',
            $approved
                ? "Lapangan {$field->name} sudah disetujui dan sekarang tampil untuk umum."
                : "Lapangan {$field->name} ditolak." . ($this->reason ? " Alasan: {$this->reason}" : ''),
            [
                'field_id'   => $field->id,
                'field_name' => $field->name,
                'status'     => $this->status,
            ]
        );

        if ($owner->email) {
            Mail::to($owner->email)->send(new FieldStatusMail(
                $field->name,
                $this->status,
                $this->reason,
            ));
        }
    }
}
