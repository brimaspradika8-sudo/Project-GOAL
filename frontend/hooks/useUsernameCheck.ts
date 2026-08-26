import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../lib/apiClient';
import { useDebouncedValue } from './useDebouncedValue';

export type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error';

export function useUsernameCheck(rawUsername: string): UsernameStatus {
  // Ultra-fast 80ms debounce for near-instant typing feedback
  const debouncedUsername = useDebouncedValue(rawUsername, 80);
  const [status, setStatus] = useState<UsernameStatus>('idle');
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const checkCache = useRef<Map<string, 'available' | 'taken'>>(new Map());

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  // Instant local evaluation
  useEffect(() => {
    const trimmed = rawUsername.trim();
    if (trimmed.length === 0) {
      setStatus('idle');
      return;
    }
    if (trimmed.length < 3) {
      setStatus('invalid');
      return;
    }
    const cached = checkCache.current.get(trimmed.toLowerCase());
    if (cached) {
      setStatus(cached);
    } else {
      setStatus('checking');
    }
  }, [rawUsername]);

  useEffect(() => {
    const trimmed = debouncedUsername.trim();
    if (trimmed.length < 3) return;

    const cached = checkCache.current.get(trimmed.toLowerCase());
    if (cached) {
      setStatus(cached);
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    const timeoutId = setTimeout(() => {
      controller.abort(new DOMException('Username check timeout', 'TimeoutError'));
    }, 3000);

    const checkUsername = async () => {
      if (!mountedRef.current) return;
      try {
        // Use skipToken: true to bypass SecureStore disk read delay
        const res = await apiFetch(`/me/onboarding/check-username?username=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
          timeout: 4000,
        });

        const json = await res.json().catch(() => null);

        if (!res.ok || json === null) {
          if (mountedRef.current) setStatus('error');
          return;
        }

        const result: 'available' | 'taken' = json?.data?.available ? 'available' : 'taken';
        checkCache.current.set(trimmed.toLowerCase(), result);
        if (mountedRef.current) {
          setStatus(result);
        }
      } catch (e: any) {
        const isAbort = e?.name === 'AbortError' || e?.name === 'TimeoutError' || e?.code === 'ERR_CANCELED' || (typeof e?.message === 'string' && e.message.toLowerCase().includes('abort'));
        if (!isAbort && mountedRef.current) {
          setStatus('error');
        }
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

