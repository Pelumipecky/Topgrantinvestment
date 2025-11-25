import styles from "./InvestmentSect.module.css";
import { PLAN_CONFIG, formatPercent } from "../../utils/planConfig";

const InvestmentSect = ({ setWidgetState, setInvestData, currentUser, investments}) => {
  const currentDate = new Date();

  const currentDayOfMonth = currentDate.getDate();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const dateString =
    currentYear + "-" + (currentMonth + 1) + "-" + currentDayOfMonth;

  const getInvestmentStartDate = (investment) => {
    if (!investment) return new Date();
    if (investment.approved_at) return new Date(investment.approved_at);
    if (investment.approvedAt) return new Date(investment.approvedAt);
    if (investment.updated_at) return new Date(investment.updated_at);
    if (investment.updatedAt) return new Date(investment.updatedAt);
    return new Date(investment.date);
  };

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
    <div className={styles.investmentContainer}>
      <div className={styles.myinvestmentSection}>
        <h2 className={styles.sectionTitle}>Investments History</h2>
        {
            investments.length > 0 ? (
                <div className={styles.historyTable}>
                    <div className={styles.tableHeader}>
                        <div>S/N</div>
                        <div>Plan</div>
                        <div>Capital</div>
                        <div>Status</div>
                        <div>Days Spent</div>
                        <div>Days Remaining</div>
                    </div>
                    {
                        investments.sort((a, b) => {
                          const dateA = new Date(a.date);
                          const dateB = new Date(b.date);
                        
                          return dateB - dateA;
                        }).map((elem, idx) => (
                            <div className={styles.tableRow} key={`${elem.id}-userDash_${idx}`}>
                                <div data-label="S/N">{idx + 1}</div>
                                <div data-label="Plan">{elem?.plan}</div>
                                <div data-label="Capital">${elem?.capital.toLocaleString()}</div>
                                <div data-label="Status">
                                  <span className={`${styles.status} ${
                                    elem?.status === "Pending" ? styles.statusPending : 
                                    elem?.status === "Expired" ? styles.statusExpired : 
                                    styles.statusActive
                                  }`}>
                                    {elem?.status}
                                  </span>
                                </div>
                                {(() => {
                                  if (elem?.status === "Pending") {
                                    return (
                                      <>
                                        <div data-label="Days Spent">0</div>
                                        <div data-label="Days Remaining">{elem?.duration}</div>
                                      </>
                                    );
                                  }

                                  const startDate = getInvestmentStartDate(elem);
                                  const daysElapsed = Math.max(0, Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24)));
                                  const cappedDays = Math.min(daysElapsed, elem?.duration || 0);
                                  const remainingDays = Math.max((elem?.duration || 0) - cappedDays, 0);

                                  if (elem?.status === "Expired") {
                                    return (
                                      <>
                                        <div data-label="Days Spent">{elem?.duration || 0}</div>
                                        <div data-label="Days Remaining">0</div>
                                      </>
                                    );
                                  }

                                  return (
                                    <>
                                      <div data-label="Days Spent">{cappedDays}</div>
                                      <div data-label="Days Remaining">{remainingDays}</div>
                                    </>
                                  );
                                })()}
                            </div>
                        ))
                    }
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <i className="icofont-chart-growth"></i>
                    <p>
                        Your investment history is currently empty.{" "}
                        <a href="#packages" style={{color: '#FFB347'}}>Invest now</a>
                    </p>
                </div>
            )
        }
        
        <section className={styles.packages} id="packages">
          <h2 className={styles.packagesTitle}>Our Available Packages</h2>
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
                      <span className={styles.featureText}>Withdraw after {plan.durationLabel}</span>
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
      </div>
    </div>
  );
};

export default InvestmentSect;
