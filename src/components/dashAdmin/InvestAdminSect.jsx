import React, { useEffect, useState, useCallback } from 'react';
import { supabaseDb } from "../../database/supabaseUtils";
import { supabase } from "../../database/supabaseConfig";
import { PLAN_CONFIG_MAP, LEGACY_PLAN_RULES, formatPercent } from "../../utils/planConfig";

const InvestAdminSect = ({ setInvestData, setProfileState, investments, totalCapital, bitPrice, ethPrice, currentUser }) => {
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Calculate total ROI and bonus (both credited and total)
    const totalCreditedROI = investments.reduce((sum, inv) => sum + (parseFloat(inv.credited_roi) || 0), 0);
    const totalROI = investments.reduce((sum, inv) => sum + (parseFloat(inv.roi) || 0), 0);
    const totalCreditedBonus = investments.reduce((sum, inv) => sum + (parseFloat(inv.credited_bonus) || 0), 0);
    const totalBonus = investments.reduce((sum, inv) => sum + (parseFloat(inv.bonus) || 0), 0);
    
    // Filter investments based on status and search
    const filteredInvestments = investments.filter(inv => {
        const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
        const matchesSearch = !searchTerm || 
            inv.plan.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.idnum.toString().includes(searchTerm);
        return matchesStatus && matchesSearch;
    });

    const investmentStartDate = useCallback((investment) => {
      if (!investment) return new Date();
      if (investment.approved_at) return new Date(investment.approved_at);
      if (investment.approvedAt) return new Date(investment.approvedAt);
      if (investment.updated_at) return new Date(investment.updated_at);
      if (investment.updatedAt) return new Date(investment.updatedAt);
      return new Date(investment.date);
    }, []);

    const handleActiveInvestment = useCallback(async (vlad) => {
        try {
            await supabaseDb.updateInvestment(vlad?.id, {
                status: "Expired",
            });
            setProfileState("Withdrawals");
        } catch (error) {
            console.error('Error updating investment:', error);
        }
    }, [setProfileState]);

    // Function to distribute earnings over time
    const distributeEarnings = useCallback(async (investment) => {
        try {
            const investmentDate = investmentStartDate(investment);
            const now = new Date();
            const daysElapsed = Math.floor((now - investmentDate) / (1000 * 60 * 60 * 24));

            if (daysElapsed < 1) return; // No earnings yet

            const totalDuration = investment.duration || 1;
            const effectiveDays = Math.min(daysElapsed, totalDuration);
            const roiPerDay = parseFloat(investment.roi) / totalDuration;
            const bonusPerDay = parseFloat(investment.bonus) / totalDuration;

            const earnedROI = Math.min(roiPerDay * effectiveDays, parseFloat(investment.roi));
            const earnedBonus = Math.min(bonusPerDay * effectiveDays, parseFloat(investment.bonus));

            // Find user and update their earnings
            const { data: userData, error: userError } = await supabase
                .from('userlogs')
                .select('*')
                .eq('idnum', investment.idnum)
                .single();

            if (userError || !userData) {
                console.error('User lookup error for earnings distribution:', userError);
                return;
            }

            // Calculate how much should be credited today vs already credited
            const previouslyCreditedROI = parseFloat(investment.credited_roi || 0);
            const previouslyCreditedBonus = parseFloat(investment.credited_bonus || 0);

            const roiToCredit = earnedROI - previouslyCreditedROI;
            const bonusToCredit = earnedBonus - previouslyCreditedBonus;

            if (roiToCredit > 0 || bonusToCredit > 0) {
                const currentBalance = parseFloat(userData.balance) || 0;
                const currentBonus = parseFloat(userData.bonus) || 0;

                console.log(`Distributing earnings for investment ${investment.id}:`);
                console.log(`ROI to credit: $${roiToCredit.toFixed(2)}, Bonus to credit: $${bonusToCredit.toFixed(2)}`);

                // Update user balance with earnings
                const { error: userUpdateError } = await supabase
                    .from('userlogs')
                    .update({
                        balance: currentBalance + roiToCredit,
                        bonus: currentBonus + bonusToCredit,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', userData.id);

                if (userUpdateError) {
                    console.error('Error updating user earnings:', userUpdateError);
                    return;
                }

                // Update investment with credited amounts
                const { error: investUpdateError } = await supabase
                    .from('investments')
                    .update({
                        credited_roi: earnedROI,
                        credited_bonus: earnedBonus,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', investment.id);

                if (investUpdateError) {
                    console.error('Error updating investment credited amounts:', investUpdateError);
                }

                // Create notification for earnings
                if (roiToCredit > 0 || bonusToCredit > 0) {
                    const notificationPush = {
                      title: 'Investment Earnings',
                      message: `You've earned $${roiToCredit.toFixed(2)} ROI and $${bonusToCredit.toFixed(2)} bonus from your ${investment.plan} investment (Day ${Math.min(effectiveDays, totalDuration)}/${totalDuration}).`,
                        idnum: investment.idnum,
                        status: 'unseen',
                        type: 'earnings'
                    };

                    await supabaseDb.createNotification(notificationPush);
                }
            }

        } catch (error) {
            console.error('Error distributing earnings:', error);
        }
      }, [investmentStartDate]);

    useEffect(() => {
        investments.forEach((elem) => {
            if (elem?.status === "Active") {
            const startDate = investmentStartDate(elem);
            const daysElapsed = Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24));

                // Distribute earnings for active investments
                distributeEarnings(elem);

                // Check if investment should expire
            if (daysElapsed >= elem?.duration) {
                    handleActiveInvestment(elem);
                }
            }
        });
      }, [distributeEarnings, handleActiveInvestment, investmentStartDate, investments]);
  return (
    <div className="investmentMainCntn">
      <div className="overviewSection">
        <div className="dashboardStats">
          <div className="statCard">
            <h3>Total Revenue</h3>
            <h2>${totalCapital ? totalCapital.toLocaleString() : '0'}</h2>
          </div>
          <div className="statCard">
            <h3>Total ROI</h3>
            <h2>${totalCreditedROI.toLocaleString()} / ${totalROI.toLocaleString()}</h2>
            <small style={{color: '#666', fontSize: '0.9em'}}>Credited / Total</small>
          </div>
          <div className="statCard">
            <h3>Total Bonus</h3>
            <h2>${totalCreditedBonus.toLocaleString()} / ${totalBonus.toLocaleString()}</h2>
            <small style={{color: '#666', fontSize: '0.9em'}}>Credited / Total</small>
          </div>
          <div className="statCard">
            <h3>Active Investments</h3>
            <h2>{investments.filter(i => i.status === 'Active').length}</h2>
          </div>
          <div className="statCard">
            <h3>Pending Investments</h3>
            <h2>{investments.filter(i => i.status === 'Pending').length}</h2>
          </div>
          <div className="statCard">
            <h3>Bitcoin Price</h3>
            <h2>${bitPrice ? Number(bitPrice).toLocaleString() : '0'}</h2>
          </div>
          <div className="statCard">
            <h3>Ethereum Price</h3>
            <h2>${ethPrice ? Number(ethPrice).toLocaleString() : '0'}</h2>
          </div>
        </div>
        <div className="filterSection">
          <div className="searchBox">
            <input 
              type="text" 
              placeholder="Search by plan or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="statusFilter">
            <button 
              className={filterStatus === 'all' ? 'active' : ''} 
              onClick={() => setFilterStatus('all')}
            >
              All
            </button>
            <button 
              className={filterStatus === 'Active' ? 'active' : ''} 
              onClick={() => setFilterStatus('Active')}
            >
              Active
            </button>
            <button 
              className={filterStatus === 'Pending' ? 'active' : ''} 
              onClick={() => setFilterStatus('Pending')}
            >
              Pending
            </button>
            <button 
              className={filterStatus === 'Expired' ? 'active' : ''} 
              onClick={() => setFilterStatus('Expired')}
            >
              Expired
            </button>
          </div>
        </div>
      </div>
      <div className="myinvestmentSection">
        <h2>Investments Stack</h2>
        {
            investments.length > 0 ? (
                <div className="investmentsTableContainer">
                    <table className="investmentsTable">
                        <thead>
                            <tr>
                                <th>S/N</th>
                                <th>User ID</th>
                                <th>Plan</th>
                                <th>Capital</th>
                                <th>ROI (Credited/Total)</th>
                                <th>Bonus (Credited/Total)</th>
                                <th>Duration</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                investments.sort((a, b) => {
                                    const dateA = new Date(a.date);
                                    const dateB = new Date(b.date);
                                  
                                    return dateB - dateA;
                                }).map((elem, idx) => (
                                    <tr key={`${elem.id}-aDash_${idx}`} style={{cursor: 'default'}}>
                                        <td>{idx + 1}</td>
                                        <td className="cryptic-id">{elem?.idnum?.toString() || 'N/A'}</td>
                                        <td>{elem?.plan || 'N/A'}</td>
                                        <td className="capital">${parseFloat(elem?.capital || 0).toLocaleString()}</td>
                                        <td className="roi">
                                            ${parseFloat(elem?.credited_roi || 0).toLocaleString()} / ${parseFloat(elem?.roi || 0).toLocaleString()}
                                            <br />
                                            <small style={{color: '#666', fontSize: '0.8em'}}>
                                              {elem?.status === 'Active' ? `${Math.min(Math.floor((new Date() - investmentStartDate(elem)) / (1000 * 60 * 60 * 24)), elem?.duration || 0)}/${elem?.duration || 0} days` : ''}
                                            </small>
                                        </td>
                                        <td className="bonus">
                                            ${parseFloat(elem?.credited_bonus || 0).toLocaleString()} / ${parseFloat(elem?.bonus || 0).toLocaleString()}
                                            <br />
                                            <small style={{color: '#666', fontSize: '0.8em'}}>
                                              {elem?.status === 'Active' ? `${Math.min(Math.floor((new Date() - investmentStartDate(elem)) / (1000 * 60 * 60 * 24)), elem?.duration || 0)}/${elem?.duration || 0} days` : ''}
                                            </small>
                                        </td>
                                        <td>{elem?.duration || 0} days</td>
                                        <td>{elem?.paymentOption || 'N/A'}</td>
                                        <td>
                                            <span className={`investment-status ${elem?.status?.toLowerCase() || 'pending'}`}>
                                                {elem?.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td>{(() => {
                                            const dateVal = elem?.date || elem?.created_at || elem?.createdAt;
                                            if (!dateVal) return 'N/A';
                                            const dateObj = new Date(dateVal);
                                            return isNaN(dateObj.getTime()) ? 'Invalid Date' : dateObj.toLocaleDateString("en-US", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric"
                                            });
                                        })()}</td>
                                        <td>
                                            <div className="action-buttons">
                                                {elem?.status === 'Pending' && (
                                                    <button
                                                        className="action-btn approve"
                                                        onClick={async (e) => {
                                                            e.stopPropagation();

                                                            // Calculate ROI using new plan config (fallback to legacy rules if needed)
                                                            const capital = parseFloat(elem.capital) || 0;
                                                            const planConfig = PLAN_CONFIG_MAP[elem.plan];
                                                            const legacyRule = PLAN_CONFIG_MAP[elem.plan] ? null : LEGACY_PLAN_RULES[elem.plan?.toLowerCase() || ''];
                                                            const fallbackDuration = elem.duration || planConfig?.durationDays || 7;
                                                            const termLabel = planConfig?.durationLabel || `${fallbackDuration} days`;

                                                            let calculatedROI = 0;
                                                            let calculatedBonus = 0;
                                                            let payoutSummary = '';

                                                            if (planConfig) {
                                                              calculatedROI = capital * planConfig.dailyRate * planConfig.durationDays;
                                                              payoutSummary = `${formatPercent(planConfig.dailyRate)} daily • ${planConfig.durationLabel}`;
                                                            } else if (legacyRule) {
                                                              calculatedROI = capital * legacyRule.roiMultiplier;
                                                              calculatedBonus = capital * legacyRule.bonusMultiplier;
                                                              payoutSummary = `${legacyRule.roiMultiplier}X ROI (legacy ${elem.plan} plan)`;
                                                            } else {
                                                              const fallbackRate = 0.025;
                                                              calculatedROI = capital * fallbackRate * fallbackDuration;
                                                              payoutSummary = `${formatPercent(fallbackRate)} daily • ${fallbackDuration} days (fallback)`;
                                                            }

                                                            const confirmMessage = [
                                                              `Approve investment ${elem.id} for user ${elem.idnum}?`,
                                                              '',
                                                              `Plan: ${elem.plan}`,
                                                              `Capital: $${capital.toLocaleString()}`,
                                                              `Projected earnings: $${calculatedROI.toLocaleString()}`,
                                                              calculatedBonus > 0 ? `Legacy bonus: $${calculatedBonus.toLocaleString()}` : null,
                                                              `Payout schedule: ${payoutSummary}`,
                                                              '',
                                                              `This will credit the capital immediately. Earnings accrue over ${termLabel}.`
                                                            ].filter(Boolean).join('\n');

                                                            const ok = window.confirm(confirmMessage);
                                                            if (!ok) return;

                                                            const dailyRateLabel = planConfig ? formatPercent(planConfig.dailyRate) : legacyRule ? `${legacyRule.roiMultiplier}X legacy ROI` : formatPercent(0.025);
                                                            const capitalFormatted = capital.toLocaleString();
                                                            const roiFormatted = calculatedROI.toLocaleString();
                                                            const bonusFormatted = calculatedBonus.toLocaleString();

                                                            try {
                                                                console.log('Starting investment approval for:', elem.id);
                                                                console.log('Investment data:', elem);
                                                                console.log('Calculated ROI:', calculatedROI, 'Bonus:', calculatedBonus);

                                                                // Find user by idnum
                                                                const { data: userData, error: userError } = await supabase
                                                                    .from('userlogs')
                                                                    .select('*')
                                                                    .eq('idnum', elem.idnum)
                                                                    .single();

                                                                if (userError) {
                                                                    console.error('User lookup error:', userError);
                                                                    throw new Error('User not found');
                                                                }

                                                                console.log('Found user:', userData.id);

                                                                const approvedBy = currentUser?.id || currentUser?.userName || 'admin';

                                                                await supabaseDb.activateInvestment(elem.id, {
                                                                    approvedBy,
                                                                    capital,
                                                                    roi: calculatedROI,
                                                                    bonus: calculatedBonus,
                                                                    idnum: elem.idnum,
                                                                    creditBonus: false
                                                                });

                                                                // Add notification
                                                                const payoutMessage = calculatedBonus > 0
                                                                  ? `You will earn $${roiFormatted} ROI and $${bonusFormatted} bonus over ${termLabel}.`
                                                                  : `You will earn $${roiFormatted} in daily commissions (${payoutSummary}).`;

                                                                const notificationPush = {
                                                                  title: 'Investment Approved',
                                                                  message: `Your $${capitalFormatted} ${elem.plan} investment has been activated! ${payoutMessage} Capital and earnings unlock after ${termLabel}.`,
                                                                  idnum: elem.idnum,
                                                                  status: 'unseen',
                                                                  type: 'success'
                                                                };

                                                                const notificationResult = await supabaseDb.createNotification(notificationPush);
                                                                if (notificationResult.error) {
                                                                    console.error('Notification creation error:', notificationResult.error);
                                                                    // Don't throw here - notification failure shouldn't block approval
                                                                } else {
                                                                    console.log('Notification created successfully');
                                                                }

                                                                // Send email notification to user
                                                                try {
                                                                    if (userData?.email) {
                                                                        const emailSubject = 'Investment Approved - Grant Union Investment';
                                                                        const emailMessage = `
                                                                          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                                                            <h2 style="color: #28a745;">🎉 Investment Approved!</h2>
                                                                            <p>Dear ${userData.name || 'User'},</p>
                                                                            <p>Congratulations! Your investment has been approved and activated.</p>
                                                                            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                                                              <h3 style="margin-top: 0;">Investment Details:</h3>
                                                                              <ul style="list-style: none; padding: 0;">
                                                                                <li><strong>Plan:</strong> ${elem.plan}</li>
                                                                                <li><strong>Capital:</strong> $${capitalFormatted}</li>
                                                                                <li><strong>Projected Earnings:</strong> $${roiFormatted}</li>
                                                                                ${calculatedBonus > 0 ? `<li><strong>Legacy Bonus:</strong> $${bonusFormatted}</li>` : ''}
                                                                                <li><strong>Payout Schedule:</strong> ${payoutSummary}</li>
                                                                                <li><strong>Daily Rate:</strong> ${dailyRateLabel}</li>
                                                                                <li><strong>Term:</strong> ${termLabel}</li>
                                                                              </ul>
                                                                            </div>
                                                                            <p>Your capital has been credited to your account balance. Earnings will be posted daily according to the schedule above, and you can withdraw capital plus commissions once the term is complete.</p>
                                                                            <p>Best regards,<br>Grant Union Investment Team</p>
                                                                            <hr>
                                                                            <p style="font-size: 12px; color: #666;">
                                                                              This is an automated message. Please do not reply to this email.
                                                                            </p>
                                                                          </div>
                                                                        `;

                                                                        const emailResponse = await fetch('/api/send-email', {
                                                                          method: 'POST',
                                                                          headers: {
                                                                            'Content-Type': 'application/json',
                                                                          },
                                                                          body: JSON.stringify({
                                                                            to: userData.email,
                                                                            subject: emailSubject,
                                                                            message: emailMessage,
                                                                            type: 'investment_approval'
                                                                          })
                                                                        });

                                                                        if (emailResponse.ok) {
                                                                          console.log('Investment approval email sent successfully');
                                                                        } else {
                                                                          console.error('Failed to send investment approval email');
                                                                        }
                                                                    }
                                                                } catch (emailError) {
                                                                    console.error('Error sending investment approval email:', emailError);
                                                                    // Don't throw here - email failure shouldn't block approval
                                                                }

                                                                alert(`✅ Investment approved successfully!\n\nUser ${elem.idnum} has been credited $${capitalFormatted}.\nProjected earnings: $${roiFormatted}${calculatedBonus > 0 ? ` + legacy bonus $${bonusFormatted}` : ''}.\nSchedule: ${payoutSummary}.`);

                                                                // Force a refresh of the investments data
                                                                window.location.reload();

                                                            } catch (err) {
                                                                console.error('Investment approval error:', err);
                                                                alert(`❌ Failed to approve investment: ${err.message}`);
                                                            }
                                                        }}
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>

            ) : (

                <div className="emptyTable">
                    <i className="icofont-exclamation-tringle"></i>
                    <p>
                        Your investment stack is currently empty.
                    </p>
                </div>
            )
        }
      </div>
    </div>
  )
}

export default InvestAdminSect
