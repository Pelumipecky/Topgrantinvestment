import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Plan Configuration (Mirrors src/utils/planConfig.js)
const PLANS = {
  "7-Day Plan": { dailyRate: 0.025, duration: 7 },
  "14-Day Plan": { dailyRate: 0.03, duration: 14 },
  "3-Month Plan": { dailyRate: 0.035, duration: 90 },
  "6-Month Plan": { dailyRate: 0.04, duration: 180 }
};

async function updateDailyROI() {
  console.log('Starting Daily ROI Update...');

  try {
    // 1. Fetch all active investments
    const { data: investments, error: fetchError } = await supabase
      .from('investments')
      .select('*')
      .eq('status', 'Active');

    if (fetchError) throw fetchError;

    console.log(`Found ${investments.length} active investments.`);

    let updatedCount = 0;
    let completedCount = 0;

    for (const investment of investments) {
      const plan = PLANS[investment.plan];
      
      if (!plan) {
        console.warn(`Unknown plan for investment ${investment.id}: ${investment.plan}`);
        continue;
      }

      // Calculate daily ROI amount
      const capital = parseFloat(investment.capital);
      const dailyAmount = capital * plan.dailyRate;
      
      // Current credited amount
      const currentCredited = parseFloat(investment.credited_roi || 0);
      const totalExpectedROI = parseFloat(investment.roi);

      // Check if investment has reached its full ROI
      if (currentCredited >= totalExpectedROI) {
        // Mark as Completed if not already
        if (investment.status !== 'Completed') {
            await supabase
                .from('investments')
                .update({ status: 'Completed' })
                .eq('id', investment.id);
            completedCount++;
        }
        continue;
      }

      // Calculate new credited amount (cap at total expected ROI)
      let newCredited = currentCredited + dailyAmount;
      if (newCredited > totalExpectedROI) {
        newCredited = totalExpectedROI;
      }

      // Update the investment
      const { error: updateError } = await supabase
        .from('investments')
        .update({ 
          credited_roi: newCredited,
          updated_at: new Date().toISOString()
        })
        .eq('id', investment.id);

      if (updateError) {
        console.error(`Failed to update investment ${investment.id}:`, updateError);
      } else {
        console.log(`Updated investment ${investment.id}: +$${dailyAmount.toFixed(2)} (Total: $${newCredited.toFixed(2)} / $${totalExpectedROI.toFixed(2)})`);
        updatedCount++;
      }
    }

    console.log('-----------------------------------');
    console.log(`Summary:`);
    console.log(`- Processed: ${investments.length}`);
    console.log(`- ROI Credited: ${updatedCount}`);
    console.log(`- Completed Plans: ${completedCount}`);
    console.log('-----------------------------------');

  } catch (error) {
    console.error('Critical Error:', error);
  }
}

updateDailyROI();
