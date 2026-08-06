<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FieldStatusMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $fieldName,
        public string $status,
        public ?string $reason = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->status === 'approved'
                ? 'GOAL - Lapangan Disetujui'
                : 'GOAL - Lapangan Ditolak',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.field-status',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
