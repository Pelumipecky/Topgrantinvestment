import {useEffect, useState} from "react";
import { supabaseDb } from "../../database/supabaseUtils";
import { PLAN_CONFIG, formatPercent } from "../../utils/planConfig";
import styles from "./NotificationSect.module.css";

const NotificationSect = ({ setWidgetState, setInvestData, currentUser, notifications}) => {
    // use shared db instance


    const handleDetailUpdate = async (vlad) => {
      await supabaseDb.updateNotification(vlad?.id, { status: "seen" });
    };

    useEffect(() => {
      if (notifications && notifications.length > 0) {
        notifications.forEach((elem) => {
          if (elem?.status === "unseen") {
            handleDetailUpdate(elem);
          }
        });
      }
    }, [notifications]);

    
    const currentDate = new Date();
    
    const currentDayOfMonth = currentDate.getDate();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const dateString = currentYear + "-" + (currentMonth + 1) + "-" + currentDayOfMonth;
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
    <div className={styles.notificationContainer}>
      <div>
        <h2 className={styles.sectionTitle}>Notifications</h2>
        {
            notifications.length > 0 ? (
                <div className={styles.notificationList}>
                    {
                        notifications.sort((a, b) => {
                          const dateA = new Date(a.created_at);
                          const dateB = new Date(b.created_at);
                        
                          return dateB - dateA;
                        }) .map((elem, idx) => (
                            <div className={`${styles.notificationCard} ${elem?.status === 'unseen' ? styles.unread : ''}`} key={`${elem.idnum}-notiUser${idx}`}>
                                <div className={styles.iconWrapper}>
                                  <i className="icofont-notification"></i>
                                </div>
                                <div className={styles.content}>
                                  <div className={styles.header}>
                                    <div className={styles.title}>New Notification</div>
                                    <div className={styles.date}>
                                      {new Date(elem?.created_at).toLocaleDateString("en-US", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })} | {new Intl.DateTimeFormat('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false,
                                      }).format(new Date(elem?.created_at))}
                                    </div>
                                  </div>
                                  <div className={styles.message}>{elem?.message}</div>
                                </div>
                            </div>
                        ))
                    }
                </div>

            ) : (

                <div className={styles.emptyState}>
                    <i className="icofont-exclamation-tringle"></i>
                    <p>
                      Your notification stack is currently empty.
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

export default NotificationSect;
