import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../lib/api';
import * as SecureStore from '../lib/secureStorage';
import { TOKEN_KEY } from '../lib/auth';
import { useDebouncedValue } from './useDebouncedValue';

export type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error';

export function useUsernameCheck(rawUsername: string): UsernameStatus {
  // Debounce lebih panjang agar request tidak terus di-abort saat user mengetik
  const debouncedUsername = useDebouncedValue(rawUsername, 600);
  const [status, setStatus] = useState<UsernameStatus>('idle');
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  // FIX: Cache dipindah ke dalam hook (per-instance) supaya tidak nyangkut antar sesi
  const checkCache = useRef<Map<string, 'available' | 'taken'>>(new Map());

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      // Batalkan request yang sedang berjalan saat unmount
      abortRef.current?.abort();
    };
  }, []);

  // Update status sinkron saat user masih mengetik (sebelum debounce)
  useEffect(() => {
    if (rawUsername.length === 0) {
      setStatus('idle');
      return;
    }
    if (rawUsername.length > 0 && rawUsername.length < 3) {
      setStatus('invalid');
      return;
    }
    // Saat user masih mengetik (belum debounced), tunjukkan 'checking'
    setStatus('checking');
  }, [rawUsername]);

  useEffect(() => {
    if (debouncedUsername.length < 3) return;

    const cached = checkCache.current.get(debouncedUsername.toLowerCase());
    if (cached) {
      setStatus(cached);
      return;
    }

    // Batalkan request sebelumnya
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    // Timeout 8 detik (lebih longgar dari default)
    const timeoutId = setTimeout(() => {
      controller.abort(new DOMException('Username check timeout', 'TimeoutError'));
    }, 8000);

    const checkUsername = async () => {
      if (!mountedRef.current) return;
      setStatus('checking');
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);

        const res = await fetch(
          `${API_BASE_URL}/me/onboarding/check-username?username=${encodeURIComponent(debouncedUsername)}`,
          {
            headers: {
              Accept: 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            signal: controller.signal,
          }
        );

        const json = await res.json().catch(() => null);

        if (!res.ok || json === null) {
          if (mountedRef.current) setStatus('error');
          return;
        }

        const result: 'available' | 'taken' = json?.data?.available ? 'available' : 'taken';
        // FIX: Hanya cache 'available', tidak cache 'taken'
        // supaya username yang baru dibebaskan bisa dicek ulang ke API
        if (result === 'available') {
          checkCache.current.set(debouncedUsername.toLowerCase(), result);
        }
        if (mountedRef.current) {
          setStatus(result);
        }
      } catch (e: any) {
        // Abaikan error yang disebabkan oleh abort (bukan error nyata)
        const isAbort = e?.name === 'AbortError' || e?.name === 'TimeoutError';
        if (!isAbort && mountedRef.current) {
          setStatus('error');
        }
        // Jika abort, biarkan status 'checking' digantikan request berikutnya
      } finally {
        clearTimeout(timeoutId);
      }
    };

    checkUsername();

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [debouncedUsername]);

  return status;
}

