import React from 'react';
import EmptyState from './EmptyState';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = 'Data belum bisa dimuat',
  description = 'Periksa koneksi lalu coba lagi.',
  onRetry,
}: ErrorStateProps) {
  return (
    <EmptyState
      icon="wifi-off"
      title={title}
      description={description}
      actionLabel={onRetry ? 'Coba Lagi' : undefined}
      onAction={onRetry}
    />
  );
}
