import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { API_BASE_URL } from '../lib/api';
import { useDebouncedValue } from './useDebouncedValue';

export type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export function useUsernameCheck(rawUsername: string): UsernameStatus {
  const debouncedUsername = useDebouncedValue(rawUsername, 500);
  const [status, setStatus] = useState<UsernameStatus>('idle');

  useEffect(() => {
    if (rawUsername.length > 0 && rawUsername.length < 3) {
      setStatus('invalid');
      return;
    }
    if (rawUsername.length === 0) {
      setStatus('idle');
      return;
    }
    // While waiting for debounce
    setStatus('checking');
  }, [rawUsername]);

  useEffect(() => {
    if (debouncedUsername.length < 3) return;

    const checkUsername = async () => {
      setStatus('checking');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
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
      } catch {
        // On network error or timeout, allow user to still try submitting
        setStatus('available');
      } finally {
        clearTimeout(timeout);
      }
    };

    checkUsername();
  }, [debouncedUsername]);

  return status;
}
