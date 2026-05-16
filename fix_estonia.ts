import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Searching for Estonia profile in skin_assessments...");
  const { data, error } = await adminClient
    .from('skin_assessments')
    .select('id, country_of_residence, climate_zone, formula_code')
    .ilike('country_of_residence', '%Estonia%')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    console.log("Could not find Estonia profile or error:", error);
    return;
  }

  console.log("Found Estonia profile:", data);

  const { error: updateError } = await adminClient
    .from('skin_assessments')
    .update({ climate_zone: 'cold_continental' })
    .eq('id', data.id);

  if (updateError) {
    console.error("Failed to update profile:", updateError);
  } else {
    console.log("Successfully updated climate zone to cold_continental for Estonia profile!");
  }
}

run();
