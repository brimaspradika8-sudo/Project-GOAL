require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_KEY
);

async function testSignup() {
  const email = 'brimas@gmail.com';
  const password = 'BrimasGOAL123';

  console.log(`Mencoba mendaftarkan: ${email}`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Brimas' } }
  });

  if (error) {
    console.error("GAGAL:", error.message);
  } else {
    console.log("BERHASIL! User ID:", data.user?.id);
    console.log("Email confirmed:", data.user?.email_confirmed_at ? "Yes" : "No (ok jika konfirmasi dimatikan)");
  }
}

testSignup();
