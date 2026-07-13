import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { API_BASE_URL } from '../lib/api';
import { useDebouncedValue } from './useDebouncedValue';

export type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error';

export function useUsernameCheck(rawUsername: string): UsernameStatus {
  const debouncedUsername = useDebouncedValue(rawUsername, 500);
  const [status, setStatus] = useState<UsernameStatus>('idle');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (rawUsername.length > 0 && rawUsername.length < 3) {
      setStatus('invalid');
      return;
    }
    if (rawUsername.length === 0) {
      setStatus('idle');
      return;
    }
    setStatus('checking');
  }, [rawUsername]);

  useEffect(() => {
    if (debouncedUsername.length < 3) return;

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;
    let timeout: ReturnType<typeof setTimeout>;

    const checkUsername = async () => {
      setStatus('checking');
      timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const res = await fetch(
          `${API_BASE_URL}/me/onboarding/check-username?username=${encodeURIComponent(debouncedUsername)}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            signal: controller.signal,
          }
        );

        if (!res.ok) throw new Error('Network error');

        const json = await res.json();
        setStatus(json.available ? 'available' : 'taken');
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
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
