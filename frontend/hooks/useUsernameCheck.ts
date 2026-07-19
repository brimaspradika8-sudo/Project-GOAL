import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../lib/api';
import { TOKEN_KEY } from '../app/_layout';
import { useDebouncedValue } from './useDebouncedValue';

export type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error';

export function useUsernameCheck(rawUsername: string): UsernameStatus {
  const debouncedUsername = useDebouncedValue(rawUsername, 500);
  const [status, setStatus] = useState<UsernameStatus>('idle');
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

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

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 5000);

    const checkUsername = async () => {
      if (!mountedRef.current) return;
      setStatus('checking');
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);

        const res = await fetch(
          `${API_BASE_URL}/me/onboarding/check-username?username=${encodeURIComponent(debouncedUsername)}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            signal: controller.signal,
          }
        );

        if (!res.ok) throw new Error('Network error');

        const json = await res.json();
        if (mountedRef.current) {
          setStatus(json.available ? 'available' : 'taken');
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
