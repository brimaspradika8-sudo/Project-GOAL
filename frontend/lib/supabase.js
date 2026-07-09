import 'react-native-url-polyfill/auto'
import { Platform } from 'react-native'
import { createClient } from '@supabase/supabase-js'

// Menyediakan storage khusus Mobile saja, untuk Web biarkan Supabase gunakan default (localStorage)
let mobileStorage = undefined;
if (Platform.OS !== 'web') {
  mobileStorage = require('@react-native-async-storage/async-storage').default;
}

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_KEY,
  {
    auth: {
      ...(mobileStorage ? { storage: mobileStorage } : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  }
)