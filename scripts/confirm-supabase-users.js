import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const targetEmail = process.argv[2]?.toLowerCase();

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase URL or service role key. Double-check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function confirmUsers() {
  let page = 1;
  let totalChecked = 0;
  let totalConfirmed = 0;

  console.log('Starting Supabase email confirmation sync...');
  if (targetEmail) {
    console.log(`Filtering for email: ${targetEmail}`);
  }

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });

    if (error) {
      console.error('Failed to list users:', error);
      process.exit(1);
    }

    const users = data?.users || [];
    if (users.length === 0) {
      break;
    }

    for (const user of users) {
      if (targetEmail && user.email?.toLowerCase() !== targetEmail) {
        continue;
      }

      totalChecked += 1;
      if (user.email_confirmed_at) {
        continue;
      }

      try {
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          email_confirm: true,
          user_metadata: {
            ...(user.user_metadata || {}),
            email_verified: true,
          },
        });
        totalConfirmed += 1;
        console.log(`✔ Confirmed ${user.email}`);
      } catch (updateError) {
        console.error(`Failed to confirm ${user.email}:`, updateError);
      }
    }

    if (users.length < 100 || targetEmail) {
      break; // no more pages or target found
    }
    page += 1;
  }

  console.log('\nSummary');
  console.log('=======');
  console.log(`Users scanned: ${totalChecked}`);
  console.log(`Users confirmed: ${totalConfirmed}`);
  if (targetEmail && totalConfirmed === 0) {
    console.warn('No matching users needed confirmation.');
  }
}

confirmUsers().catch((err) => {
  console.error('Unexpected failure while confirming users:', err);
  process.exit(1);
});
