import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Testimonies from '../components/home/testimonies';
import FAQ from '../components/home/FAQ';
import Footer from '../components/home/Footer';
import Navbar from '../components/home/Navbar';
import AdvancedChartWidget from '../components/dashboard/LengthyAnalytics';
import GuideSection from '../components/home/GuideSection';
import { PLAN_CONFIG, formatPercent } from '../utils/planConfig';
import dashboardStyles from '../components/dashboard/DashboardSect.module.css';

export default function Home() {
  const [currentUser, setCurrentUser] = useState({});
  const [showsidecard, setShowsideCard] = useState(false);
  const [showDisplayCard, setShowDisplayCard] = useState(false);

  useEffect(() => {
    // Removed CoinGecko widget
  }, []);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('activeUser')) || JSON.parse(localStorage.getItem('activeUser'));
    setCurrentUser(user);
  }, []);

  const handleGrandMovementTraffic = (event) => {
    if (event.target.className === 'profileIcon') {
      setShowDisplayCard((prev) => !prev);
    } else {
      setShowDisplayCard(false);
    }
  };

  return (
    <div className="HomefirstPageCtn" onClick={handleGrandMovementTraffic}>
      <Navbar
        showsidecard={showsidecard}
        setShowsideCard={setShowsideCard}
        shownavOptions
        showDisplayCard={showDisplayCard}
      />
      <main>
        <section className="homeIntro">
          <h1>
            The World&apos;s Premier <br /> Investment  & Trading Platform
          </h1>
          <p>Trade with us and get a high margin return on your investment</p>
          <ul>
            <li>
              <i className="icofont-cop-badge"></i> Trading with us guarantees <span>high profit margin</span>
            </li>
            <li>
              <i className="icofont-cop-badge"></i> Leader in <span>regulatory compliance</span> and <span>security certifications</span>
            </li>
            <li>
              <i className="icofont-cop-badge"></i> Trusted by over <span> over 1 million users</span> worldwide
            </li>
            <li>
              <i className="icofont-cop-badge"></i> Get <span>$50 bonus</span> when you register with us
            </li>
          </ul>
          <div className="cta">
            <a href="#packages" className="fancyBtn">
              Invest Now
            </a>
          </div>
        </section>
        <div className="keyfactsCntn">
          <div className="keyfacts fancybg">
            <div className="unitfact">
              <h2>1M+</h2>
              <p>Active Users</p>
            </div>
            <div className="unitfact">
              <h2>$490.9M+</h2>
              <p>Total Withdrawals</p>
            </div>
            <div className="unitfact">
              <h2>$180M+</h2>
              <p>Total Investment</p>
            </div>
            <div className="unitfact">
              <h2>$700M</h2>
              <p>Market Cap</p>
            </div>
          </div>
        </div>
        <section id="about" className="about">
          <div className="whatareweabout">
            <div className="aboutimg"></div>
            <div className="abouttext">
              <h2>At Our Company</h2>
              <p>
                We are a legally operating trading/investment company. The company was created by a group of qualified experts, professional bankers, traders and analysts who specialized in 
                <span> cryptocurrency</span>, <span>binary</span>, <span>the stock</span>, <span>bond</span>, <span>futures</span>, <span>currencies</span>, <span>gold</span>, <span>silver</span> and
                <span> oil trading</span> with having more than ten years of extensive practical experiences of combined personal skills, knowledge, talents and collective ambitions for success.
              </p>
              <p>
                We believe that superior investment performance is achieved through a skillful balance of three core attributes: knowledge, experience and adaptability. There is only one way to be on the cutting edge – commitment to innovation. We do our best to
                achieve a consistent increase in investment performance for our clients, and superior value-add. We appreciate our clients loyalty and value the relationships we build with each customer.
              </p>
              <Link className="borderBtn" href="/about">
                More About Our Company...
              </Link>
            </div>
          </div>
          


          <div className="companyscopes">
            <div className="unitscope advantage">
              <h3>OUR ADVANTAGES</h3>
              <p>Our Investment Options are very fair and all transactional data is stored on Block chain, which allows to create, transfer and verify ultra-secure financial data without interference of third parties.</p>
            </div>
            <span className="vertSept" role="separator"></span>
            <div className="unitscope advantage">
              <h3>OUR GUARANTEES</h3>
              <p>We are here because we are passionate about open, transparent markets and aim to be a major driving force in widespread adoption, we assure you of maximum profit using our platform and of cause we will safeguard your data.</p>
            </div>
            <span className="vertSept" role="separator"></span>
            <div className="unitscope advantage">
              <h3>OUR MISSION</h3>
              <p>Our mission as a platform is to to help get you on the right track and earn out of every option even as you start your investing journey.</p>
            </div>
          </div>
        </section>
        <section className="features">
          <h2>You Can Never Go Wrong With Grant Union Investment</h2>
          <div className="thefeatureGrid">
            <div className="topSubgrid">
              <div className="lefttopSubgrid">
                <div className="gridunit floater">
                  <h3>STRONG SECURITY</h3>
                  <p>Protection against DDoS attacks, full data encryption.</p>
                </div>
                <div className="gridunit floater">
                  <h3>PAYMENT OPTIONS</h3>
                  <p>Our Major payment option is Crypto currency which is accessible to all users world wide.</p>
                </div>
              </div>
              <div className="righttopsubgrid floater">
                <h3>MOBILE ACCESS</h3>
                <p>Access Your Investment conveniently on your mobile phone any time, anywhere, any day.</p>
              </div>
            </div>
            <div className="bottomSubgrid">
              <div className="leftbottomSubgrid floater">
                <h3>COST EFFECTIVE</h3>
                <p>Reasonable system fees for all platform users across all market options.</p>
              </div>
              <div className="rightBottomSubgrid floater">
                <h3>HIGH LIQUIDITY</h3>
                <p>Our Platform offers high liquidity for all investment options available to our users.</p>
              </div>
            </div>
            <div className="cta2 fancybg">
              <div className="leftCta2">
                <h2>
                  Join our <span>1M+ active users</span>
                </h2>
                <p>Get Started Today</p>
              </div>
              <a href="#packages" className="fancyBtn">
                Join now
              </a>
            </div>
          </div>
        </section>
        <section className="pathToInvest">
          <h2>Your Investment Journey Starts Here</h2>
          <div className="pathCntn">
            <div className="unitPathSect">
              <span>1.</span>
              <Image src="/download_coin.png" alt="Register" width={64} height={64} />
              <h2>Register</h2>
              <p>Complete Our Details and Verify Your Email Address.</p>
            </div>
            <div className="unitPathSect">
              <span>2.</span>
              <Image src="/add_coins.png" alt="Register" width={64} height={64} />
              <h2>Buy any of our packages</h2>
              <p>Fund your wallet and buy into any plan of your choice and watch our system trade for you.</p>
            </div>
            <div className="unitPathSect">
              <span>3.</span>
              <Image src="/buy_sell.png" alt="Register" width={64} height={64} />
              <h2>Start Earning</h2>
              <p>Instantly watch your investment grow. Pay Outs Every 60 Minutes.</p>
            </div>
          </div>
        </section>

        <GuideSection />

        {!currentUser?.admin && (
          <section id="packages" className={`homePackagesSection ${dashboardStyles.packages}`}>
            <h2 className={dashboardStyles.packagesTitle}>Kickstart Your Journey To Financial Freedom</h2>
            <p className="packageSummary">
              Grant Union is an officially registered company operating worldwide under International Financial Legislation (IFL),
              keeping every client protected legally and financially. Each plan now clearly lists the minimum and maximum deposit
              range (from $100 up to unlimited capital) and includes a standard 10% referral bonus so you always know the exact
              requirements before investing.
            </p>
            <div className={dashboardStyles.packageGrid}>
              {PLAN_CONFIG.map((plan) => {
                const sample = plan.sampleEarning.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                const maxDepositText = plan.maxCapital
                  ? `$${plan.maxCapital.toLocaleString()}`
                  : 'Unlimited';
                const referralBonusText = formatPercent(plan.referralBonus);
                const buttonClass = `${dashboardStyles.investButton} ${
                  plan.featured ? dashboardStyles.diamondButton : dashboardStyles.standardButton
                }`;
                return (
                  <div className={`${dashboardStyles.packageCard} ${plan.featured ? dashboardStyles.diamond : ''}`} key={plan.id}>
                    <div>
                      <h3 className={dashboardStyles.packageTitle}>{plan.name}</h3>
                      <p className={dashboardStyles.planSubtitle}>{plan.subtitle}</p>
                      <div className={dashboardStyles.packagePrice}>
                        <span>{formatPercent(plan.dailyRate)} daily commission</span>
                        <span>Term: {plan.durationLabel}</span>
                      </div>
                    </div>
                    <ul className={dashboardStyles.featureList}>
                      <li className={dashboardStyles.featureItem}>
                        <i className={`icofont-tick-mark ${dashboardStyles.featureIcon}`}></i>
                        <span className={dashboardStyles.featureText}>Minimum deposit ${plan.minCapital.toLocaleString()}</span>
                      </li>
                      <li className={dashboardStyles.featureItem}>
                        <i className={`icofont-tick-mark ${dashboardStyles.featureIcon}`}></i>
                        <span className={dashboardStyles.featureText}>Maximum deposit {maxDepositText}</span>
                      </li>
                      <li className={dashboardStyles.featureItem}>
                        <i className={`icofont-tick-mark ${dashboardStyles.featureIcon}`}></i>
                        <span className={dashboardStyles.featureText}>Withdraw capital + earnings after {plan.durationLabel}</span>
                      </li>
                      <li className={dashboardStyles.featureItem}>
                        <i className={`icofont-tick-mark ${dashboardStyles.featureIcon}`}></i>
                        <span className={dashboardStyles.featureText}>{formatPercent(plan.dailyRate)} daily commission</span>
                      </li>
                      <li className={dashboardStyles.featureItem}>
                        <i className={`icofont-tick-mark ${dashboardStyles.featureIcon}`}></i>
                        <span className={dashboardStyles.featureText}>Referral bonus {referralBonusText}</span>
                      </li>
                      <li className={dashboardStyles.featureItem}>
                        <i className={`icofont-tick-mark ${dashboardStyles.featureIcon}`}></i>
                        <span className={dashboardStyles.featureText}>
                          Earn $${sample} on a $${plan.minCapital.toLocaleString()} deposit
                        </span>
                      </li>
                    </ul>
                    <Link href={currentUser?.id ? '/profile#packages' : '/signup'} className={buttonClass}>
                      {currentUser?.id ? 'Invest' : 'Get Started'}
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section style={{ width: '100%', padding: '2rem 5%', backgroundColor: '#000613' }}>
          <h2 style={{ color: '#fff', textAlign: 'center', marginBottom: '1.5rem', fontSize: '2rem' }}>Live Market Analysis</h2>
          <AdvancedChartWidget containerId="home-chart-widget" height="600px" />
        </section>

  {/* <Testimonies /> */}
        <FAQ />
        <Footer />
      </main>
    </div>
  );
}

export async function getServerSideProps() {
  return {
    props: { apod: 'ADA' },
  };
}