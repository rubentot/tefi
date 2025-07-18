const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://alalkhogcgkvtiiicfcs.supabase.co';  // From dashboard > Project Settings > API > Project URL
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsYWxraG9nY2drdnRpaWljZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjYwNDg5NCwiZXhwIjoyMDYyMTgwODk0fQ.DUF5qNPPgpswByZe4lFeI97lGUe7M_uQI7baRWsACqM';  // The service role key

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

async function updateMetadata() {
  const { data, error } = await supabase.auth.admin.updateUserById(
    '0484c63d-5147-4937-b2ec-557840fc05b2',
    { user_metadata: { email_verified: true, role: 'broker' } }
  );

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success:', data);
  }
}

updateMetadata();