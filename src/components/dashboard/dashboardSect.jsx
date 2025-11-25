import {useState} from "react";
import styles from "./DashboardSect.module.css";
import { PLAN_CONFIG, formatPercent } from "../../utils/planConfig";
import profileStyles from "./Profile.module.css";
import AdvancedChartWidget from "./LengthyAnalytics";

const DashboardSect = ({setWidgetState, currentUser, setInvestData, totalCapital = 0, totalROI = 0, totalBonus = 0, investments = []}) => {
    const [passwordShow, setPasswordShow] = useState(false);

    const userBalance = parseFloat(currentUser?.balance || 0);
    const capital = parseFloat(totalCapital || 0);
    const roi = parseFloat(totalROI || 0);
    const investmentBonus = parseFloat(totalBonus || 0);
    const signupBonus = parseFloat(currentUser?.bonus || 0);
    
    // Fix: Removed 'capital' from total to avoid double-counting. 
    // Added signupBonus to the total.
    const total = userBalance + roi + investmentBonus + signupBonus;
    const totalBonusValue = signupBonus + investmentBonus;

    const snapshotCards = [
      { label: "Available Balance", value: passwordShow ? `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "******" },
      { label: "Bonuses", value: passwordShow ? `$${totalBonusValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "******" },
      { label: "Returns", value: passwordShow ? `$${roi.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "******" },
      { label: "Active / Pending Plans", value: investments.length },
      { label: "Referrals", value: Number(currentUser?.referralCount || 0).toLocaleString() },
      { label: "Register Id", value: currentUser?.idnum || "--" },
    ];

    const handlePlanInvest = (plan) => {
      setInvestData({
        idnum: currentUser?.idnum,
        plan: plan.name,
        status: "Pending",
        capital: plan.minCapital,
        date: new Date().toISOString(),
        duration: plan.durationDays,
        paymentOption: "Bitcoin",
        authStatus: "unseen",
        admin: false,
        roi: 0,
        bonus: 0
      });
      setWidgetState({
        state: true,
        type: "invest",
      });
    };
  return (
    <>
      <div className="dashboardContent">
        <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--text-deco, #fff)' }}>Welcome back, {currentUser?.name || currentUser?.userName || 'User'}.</h2>
        </div>
        <div className={profileStyles.accountSnapshot} style={{marginBottom: '2rem'}}>
          <div className={profileStyles.snapshotHeader}>
            <h2>Account Snapshot</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <p>Quick view of your financial status.</p>
              <span
                onClick={() => setPasswordShow((prev) => !prev)}
                style={{ cursor: 'pointer', fontSize: '1.2rem', color: '#666' }}
                title={passwordShow ? "Hide financial details" : "Show financial details"}
              >
                <i className={`icofont-eye-${!passwordShow ? "alt" : "blocked"}`}></i>
              </span>
            </div>
          </div>
          <div className={profileStyles.snapshotGrid}>
            {snapshotCards.map((card) => (
              <div key={card.label} className={profileStyles.snapshotCard}>
                <p className={profileStyles.snapshotLabel}>{card.label}</p>
                <p className={profileStyles.snapshotValue}>{card.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <AdvancedChartWidget containerId="dashboard-chart-widget" />
        </div>
      </div>
        <section className={styles.packages} id="packages">
          <h2 className={styles.packagesTitle}>Investment Packages</h2>
        <div className={styles.packageGrid}>
          {PLAN_CONFIG.map((plan) => {
            const cardClass = `${styles.packageCard} ${plan.featured ? styles.diamond : ''}`;
            const buttonClass = `${styles.investButton} ${plan.featured ? styles.diamondButton : styles.standardButton}`;
            const sample = plan.sampleEarning.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return (
              <div className={cardClass} key={plan.id}>
                <div className={styles.packageTitle}>{plan.name}</div>
                <p className={styles.planSubtitle}>{plan.subtitle}</p>
                <div className={styles.packagePrice}>
                  <span>{formatPercent(plan.dailyRate)} daily commission</span>
                  <span>Term: {plan.durationLabel}</span>
                </div>
                <ul className={styles.featureList}>
                  <li className={styles.featureItem}>
                    <i className={`icofont-tick-mark ${styles.featureIcon}`}></i>
                    <span className={styles.featureText}>Minimum deposit ${plan.minCapital.toLocaleString()}</span>
                  </li>
                  <li className={styles.featureItem}>
                    <i className={`icofont-tick-mark ${styles.featureIcon}`}></i>
                    <span className={styles.featureText}>Withdraw capital + earnings after {plan.durationLabel}</span>
                  </li>
                  <li className={styles.featureItem}>
                    <i className={`icofont-tick-mark ${styles.featureIcon}`}></i>
                    <span className={styles.featureText}>{formatPercent(plan.dailyRate)} credited daily</span>
                  </li>
                  <li className={styles.featureItem}>
                    <i className={`icofont-tick-mark ${styles.featureIcon}`}></i>
                    <span className={styles.featureText}>Earn ${sample} on ${plan.minCapital.toLocaleString()}</span>
                  </li>
                </ul>
                <button
                  className={buttonClass}
                  onClick={() => handlePlanInvest(plan)}
                >
                  Start Investing
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
};

export default DashboardSect;
