import {useEffect, useState} from "react";
import { useRouter } from "next/router";
import { supabaseDb, supabaseRealtime } from "../../database/supabaseUtils";
import { supabase } from "../../database/supabaseConfig";
import styles from "./WithdrawalSect.module.css";
import Modal from "../Modal";

const WithdrawalSect = ({currentUser, setWidgetState, totalBonus, totalCapital, totalROI, setProfileState, setWithdrawData}) => {
    const router = useRouter();
    const [withdrawals, setWithdrawals] = useState([]);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [paymentOption, setPaymentOption] = useState('Bitcoin');
    const [bankName, setBankName] = useState('');
    const [bankAccountNumber, setBankAccountNumber] = useState('');
    const [bankAccountName, setBankAccountName] = useState('');
    const [bankRoutingSwift, setBankRoutingSwift] = useState('');
    const [kycStatus, setKycStatus] = useState('pending');
    const [showKycModal, setShowKycModal] = useState(false);
    const [alertModalOpen, setAlertModalOpen] = useState(false);
    const [alertModalTitle, setAlertModalTitle] = useState("");
    const [alertModalMessage, setAlertModalMessage] = useState("");
    const normalizedKycStatus = (kycStatus || '').toLowerCase();
    const isKycVerified = normalizedKycStatus === 'verified';
    useEffect(() => {
      const fetchWithdrawals = async () => {
        if (!currentUser?.idnum) return;
        
        try {
          const { data, error } = await supabaseDb.getWithdrawalsByIdnum(currentUser.idnum);
          if (!error && data) {
            setWithdrawals(data);
          }
        } catch (err) {
          console.error('Error calling getWithdrawalsByIdnum:', err);
        }
      };

      const fetchKycStatus = async () => {
        console.log('Fetching KYC status for user:', currentUser?.id);
        if (!currentUser?.id) {
          console.log('No user ID available for KYC fetch');
          return;
        }
        
        try {
          const { data, error } = await supabaseDb.getKYCByUserId(currentUser.id);
          console.log('KYC fetch result:', { data, error });
                    if (!error && data && data.length > 0) {
                        const status = (data[0].status || 'pending').toLowerCase();
                        console.log('Setting KYC status to:', status);
                        setKycStatus(status);
          } else {
            console.log('No KYC data found, setting to pending');
            setKycStatus('pending');
          }
        } catch (err) {
          console.error('Error fetching KYC status:', err);
          setKycStatus('pending');
        }
      };

      fetchWithdrawals();
      fetchKycStatus();

      // Set up real-time subscriptions
      let withdrawalsSubscription = null;
      let kycSubscription = null;
      
      if (currentUser?.idnum) {
        withdrawalsSubscription = supabaseRealtime.subscribeToWithdrawals(currentUser.idnum, (payload) => {
          console.log('Withdrawal change:', payload);
          // Refresh withdrawals when there's a change
          fetchWithdrawals();
        });
      }

      if (currentUser?.id) {
        kycSubscription = supabase
          .channel('user-kyc-withdrawal')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'kyc',
            filter: `user_id=eq.${currentUser.id}`
          }, (payload) => {
            console.log('🔄 KYC status change in withdrawal:', payload);
            if (payload.new) {
              const newStatus = (payload.new.status || 'pending').toLowerCase();
              console.log('📝 Updating KYC status in WithdrawalSect to:', newStatus);
              setKycStatus(newStatus);
            } else if (payload.eventType === 'DELETE') {
              console.log('🗑️ KYC deleted, setting to pending');
              setKycStatus('pending');
            }
          })
          .subscribe();
      }

      return () => {
        if (withdrawalsSubscription) withdrawalsSubscription.unsubscribe();
        if (kycSubscription) kycSubscription.unsubscribe();
      };
    }, [currentUser?.idnum, currentUser?.id]);

  return (
    <div className={styles.withdrawalContainer}>
        <div className={styles.topSection}>
            <h2 className={styles.balanceTitle}>
              Total Balance:
              <span className={styles.balanceAmount}>
                ${(() => {
                  // Calculate total available balance
                  // userBalance: Wallet balance (deposits)
                  // roi: Total earnings from investments
                  // totalBonus: Bonuses from investments
                  // currentUser.bonus: Signup bonus ($50)
                  
                  const userBalance = parseFloat(currentUser?.balance || 0);
                  const roi = parseFloat(totalROI || 0);
                  const investmentBonus = parseFloat(totalBonus || 0);
                  const signupBonus = parseFloat(currentUser?.bonus || 0);
                  
                  // Note: We do NOT add 'totalCapital' here because it's usually already part of userBalance 
                  // (if deposited) or tracked separately as "Active Investment". 
                  // Adding it would cause double counting.
                  
                  const total = userBalance + roi + investmentBonus + signupBonus;
                  
                  return total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                })()}
              </span>
              {!currentUser?.balance && currentUser?.balance !== 0 && (
                <span className={styles.loadingText}>(Loading...)</span>
              )}
            </h2>
            
            {/* KYC Status Indicator */}
            {!isKycVerified && (
                <div className={styles.kycWarning}>
                    <div className={styles.kycWarningContent}>
                        <i className={`icofont-warning ${styles.kycWarningIcon}`}></i>
                        <span className={styles.kycWarningText}>
                            <strong style={{ color: 'var(--danger-clr)' }}>KYC Required:</strong> Complete KYC verification to enable withdrawals.
                        </span>
                    </div>
                    <button
                        onClick={() => router.push('/kyc')}
                        className={styles.kycButton}
                    >
                        Click here to complete your KYC
                    </button>
                </div>
            )}
            
            {/* KYC Verified Indicator */}
            {isKycVerified && (
                <div className={styles.kycSuccess}>
                    <div className={styles.kycSuccessIcon}>
                        <i className="icofont-check"></i>
                    </div>
                    <div className={styles.kycSuccessContent}>
                        <h3>
                            ✅ KYC Successfully Verified!
                        </h3>
                        <p>
                            Your identity has been verified. You can now make withdrawals and access all platform features without restrictions.
                        </p>
                    </div>
                </div>
            )}
            
            <div className={styles.withdrawForm}>
                <div className={styles.formGroup}>
                    <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="Enter amount to withdraw"
                        className={styles.input}
                    />
                    <select 
                        value={paymentOption}
                        onChange={(e) => setPaymentOption(e.target.value)}
                        className={styles.select}
                    >
                        <option value="Bitcoin">Bitcoin</option>
                        <option value="Ethereum">Ethereum</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                    {paymentOption === 'Bank Transfer' && (
                        <>
                            <input
                                type="text"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                placeholder="Bank Name"
                                required
                                className={styles.input}
                            />
                            <input
                                type="text"
                                value={bankAccountNumber}
                                onChange={(e) => setBankAccountNumber(e.target.value)}
                                placeholder="Account Number"
                                required
                                className={styles.input}
                            />
                            <input
                                type="text"
                                value={bankAccountName}
                                onChange={(e) => setBankAccountName(e.target.value)}
                                placeholder="Account Holder Name"
                                required
                                className={styles.input}
                            />
                            <input
                                type="text"
                                value={bankRoutingSwift}
                                onChange={(e) => setBankRoutingSwift(e.target.value)}
                                placeholder="Routing/Swift Code (Optional)"
                                className={styles.input}
                            />
                        </>
                    )}
                </div>
                <button type="button" onClick={() => {
                    // Check KYC status first
                    if (!isKycVerified) {
                        setShowKycModal(true);
                        return;
                    }
                    
                    const amt = parseFloat(withdrawAmount);
                    if (!withdrawAmount || isNaN(amt) || amt <= 0) {
                        setAlertModalTitle("Invalid Amount");
                        setAlertModalMessage("Please enter a valid withdrawal amount");
                        setAlertModalOpen(true);
                        return;
                    }
                    if (amt < 200) {
                        setAlertModalTitle("Minimum Withdrawal");
                        setAlertModalMessage("Minimum withdrawal amount is $200");
                        setAlertModalOpen(true);
                        return;
                    }
                    // Validate bank fields if bank transfer selected
                    if (paymentOption === 'Bank Transfer') {
                        if (!bankName.trim() || !bankAccountNumber.trim() || !bankAccountName.trim()) {
                            setAlertModalTitle("Missing Details");
                            setAlertModalMessage("Please fill in all required bank details (Bank Name, Account Number, Account Holder Name)");
                            setAlertModalOpen(true);
                            return;
                        }
                    }
                    const totalBalance = (() => {
                        const userBalance = parseFloat(currentUser?.balance || 0);
                        const capital = parseFloat(totalCapital || 0);
                        const roi = parseFloat(totalROI || 0);
                        const bonus = parseFloat(totalBonus || 0);
                        return userBalance + capital + roi + bonus;
                    })();
                    if (amt > totalBalance) {
                        setAlertModalTitle("Insufficient Funds");
                        setAlertModalMessage(`Withdrawal amount cannot exceed your total balance of $${totalBalance.toLocaleString()}`);
                        setAlertModalOpen(true);
                        return;
                    }
                    // Go directly to Withdrawal Payment page with data
                    if (setWithdrawData) {
                        setWithdrawData({
                            amount: amt,
                            capital: amt,
                            paymentOption: paymentOption,
                            bankName: paymentOption === 'Bank Transfer' ? bankName : '',
                            bankAccountNumber: paymentOption === 'Bank Transfer' ? bankAccountNumber : '',
                            bankAccountName: paymentOption === 'Bank Transfer' ? bankAccountName : '',
                            bankRoutingSwift: paymentOption === 'Bank Transfer' ? bankRoutingSwift : '',
                            idnum: currentUser?.idnum,
                            userName: currentUser?.userName || currentUser?.name
                        });
                    }
                    if (setProfileState) {
                        setProfileState("Withdrawal Payment");
                    }
                }} className={styles.submitBtn}>Proceed with withdrawal</button>
                
            </div>
        </div>
        
        <div className={styles.historySection}>
            <h2 className={styles.historyTitle}>Withdrawal History</h2>
            {
                withdrawals.length > 0 ? (
                    <div className={styles.historyTable}>
                        <div className={styles.tableHeader}>
                            <div>S/N</div>
                            <div>Transaction ID</div>
                            <div>Amount</div>
                            <div>Status</div>
                            <div>Payment Option</div>
                        </div>
                        {
                            withdrawals.map((elem, idx) => (
                                <div className={styles.tableRow} key={`${elem.idnum}-wUser${idx}`}>
                                    <div data-label="S/N">{idx + 1}</div>
                                    <div data-label="Transaction ID">{elem?.id}</div>
                                    <div data-label="Amount">${elem?.amount}</div>
                                    <div data-label="Status">
                                        <span className={`${styles.status} ${elem?.status === "Pending" ? styles.statusPending : styles.statusCompleted}`}>
                                            {elem?.status}
                                        </span>
                                    </div>
                                    <div data-label="Payment Option">{elem?.paymentOption}</div>
                                </div>
                            ))
                        }
                    </div>

                ) : (

                    <div className={styles.emptyState}>
                        <i className="icofont-exclamation-tringle"></i>
                        <p>
                            Your withdrawal history is currently empty.
                        </p>
                    </div>
                )
            }
        </div>

        <div className={styles.guidelinesSection}>
            <h2 className={styles.guidelinesTitle}>Withdrawal Guidelines</h2>
            <div className={styles.guidelinesList}>
                <p className={styles.guidelineItem}>- To initiate a withdrawal, select your preferred withdrawal method and enter the amount you want to withdraw, then click &quot;Proceed&quot;.</p>
                <p className={styles.guidelineItem}>- We provide three (3) withdrawal methods (Bitcoin, Ethereum, and Bank Transfer).</p>
                <p className={styles.guidelineItem}>- Requests for withdrawals can be made at any time via this website and will be processed after admin approval.</p>
                <p className={styles.guidelineItem}>- Withdrawals are capped at the amount of funds that are currently in the account (Minimum withdrawal amount is $200).</p>
                <p className={styles.guidelineItem}>- A withdrawal processing fee may apply.</p>
                <p className={styles.guidelineItem}>- Please contact support if your withdrawal is not processed within 24 hours.</p>
            </div>
        </div>

        <Modal 
            isOpen={showKycModal} 
            onClose={() => setShowKycModal(false)} 
            title="KYC Verification Required"
        >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <i className="icofont-id-card" style={{ fontSize: '3rem', color: '#FFB347' }}></i>
                <p>Please complete KYC verification in the Profile section before making a withdrawal.</p>
                <button 
                    onClick={() => {
                        setShowKycModal(false);
                        setProfileState("Profile");
                    }}
                    style={{
                        padding: '0.8rem 1.5rem',
                        background: 'linear-gradient(45deg, #FFB347, #ff9f1a)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#000',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        width: '100%'
                    }}
                >
                    Go to Profile
                </button>
            </div>
        </Modal>

        <Modal 
            isOpen={alertModalOpen} 
            onClose={() => setAlertModalOpen(false)} 
            title={alertModalTitle}
        >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <i className="icofont-warning" style={{ fontSize: '3rem', color: '#DC1262' }}></i>
                <p>{alertModalMessage}</p>
                <button 
                    onClick={() => setAlertModalOpen(false)}
                    style={{
                        padding: '0.8rem 1.5rem',
                        background: 'linear-gradient(45deg, #FFB347, #ff9f1a)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#000',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        width: '100%'
                    }}
                >
                    Close
                </button>
            </div>
        </Modal>
    </div>
  )
}

export default WithdrawalSect
