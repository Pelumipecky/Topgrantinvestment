import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Plan Configuration
const PLANS = {
  "7-Day Plan": { dailyRate: 0.025, duration: 7 },
  "14-Day Plan": { dailyRate: 0.03, duration: 14 },
  "3-Month Plan": { dailyRate: 0.035, duration: 90 },
  "6-Month Plan": { dailyRate: 0.04, duration: 180 }
};

export default async function handler(req, res) {
  // Security check: Ensure only authorized calls (optional but recommended)
  // You can add a secret query param like ?key=MY_SECRET_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Missing Supabase credentials' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('Starting Daily ROI Update via API...');

    // 1. Fetch all active investments
    const { data: investments, error: fetchError } = await supabase
      .from('investments')
      .select('*')
      .eq('status', 'Active');

    if (fetchError) throw fetchError;

    let updatedCount = 0;
    let completedCount = 0;
    const logs = [];

    for (const investment of investments) {
      const plan = PLANS[investment.plan];
      
      if (!plan) {
        logs.push(`Unknown plan for investment ${investment.id}: ${investment.plan}`);
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
            logs.push(`Investment ${investment.id} marked as Completed.`);
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
        logs.push(`Failed to update investment ${investment.id}: ${updateError.message}`);
      } else {
        updatedCount++;
        logs.push(`Updated investment ${investment.id}: +$${dailyAmount.toFixed(2)}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Daily ROI update completed',
      stats: {
        processed: investments.length,
        updated: updatedCount,
        completed: completedCount
      },
      logs
    });

  } catch (error) {
    console.error('Critical Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
