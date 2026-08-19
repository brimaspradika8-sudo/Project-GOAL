import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../lib/api';
import * as SecureStore from '../lib/secureStorage';
import { TOKEN_KEY } from '../lib/auth';
import { useDebouncedValue } from './useDebouncedValue';

export type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error';

export function useUsernameCheck(rawUsername: string): UsernameStatus {
  const debouncedUsername = useDebouncedValue(rawUsername, 350);
  const [status, setStatus] = useState<UsernameStatus>('idle');
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  // FIX: Cache dipindah ke dalam hook (per-instance) supaya tidak nyangkut antar sesi
  const checkCache = useRef<Map<string, 'available' | 'taken'>>(new Map());

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (rawUsername.length > 0 && rawUsername.length < 3) {
      setStatus('invalid');
      return;
    }
    if (rawUsername.length === 0) {
      setStatus('idle');
      return;
    }
  }, [rawUsername]);

  useEffect(() => {
    if (debouncedUsername.length < 3) return;

    const cached = checkCache.current.get(debouncedUsername.toLowerCase());
    if (cached) {
      setStatus(cached);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 5000);

    const checkUsername = async () => {
      if (!mountedRef.current) return;
      setStatus('checking');
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);

        const res = await fetch(
          `${API_BASE_URL}/me/onboarding/check-username?username=${encodeURIComponent(debouncedUsername)}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
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
        if (e?.name !== 'AbortError' && mountedRef.current) {
          setStatus('error');
        }
      } finally {
        clearTimeout(timeout);
      }
    };

    checkUsername();

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [debouncedUsername]);

  return status;
}
