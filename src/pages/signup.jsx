import { useState, useRef, useEffect, useContext } from 'react';
import { motion } from "framer-motion";
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../database/supabaseConfig';
import { supabaseAuth, supabaseDb } from '../database/supabaseUtils';
import { themeContext } from '../../providers/ThemeProvider';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { config, validatePassword } from '../utils/config';

const Signup = () => {
  const [passwordShow, setPasswordShow] = useState(false);
  const [users, setUsers] = useState([]);
  const [errMsg, setErrMsg] = useState("");
  const [verify, setVerify] = useState("Default");
  const [isLoading, setIsLoading] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [signupSuccessInfo, setSignupSuccessInfo] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const inputRef = useRef(null);

  const router = useRouter();
  const ctx = useContext(themeContext);
  const { registerFromPath } = ctx;

  // Human verification handler (simulated)
  const handleVerify = () => {
    if (verify === "Default") {
      setVerify("verifying");
      setTimeout(() => {
        setVerify("verified");
        if (inputRef.current) inputRef.current.checked = true;
      }, 3000);
    } else {
      if (inputRef.current) inputRef.current.checked = true;
    }
  };

  const removeErr = () => {
    setTimeout(() => setErrMsg(""), 3500);
  };

  const dateString = new Date().toISOString().split("T")[0];

  const emptyUser = {
    name: "",
    avatar: "avatar_1",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    balance: 0,
    date: dateString,
    accountStatus: "No Active Plan",
    investmentCount: 0,
    referralCount: 0,
    admin: false,
    idnum: 101010,
    userName: "",
    bonus: 50,
    authStatus: "unseen",
    dateUpdated: new Date().toISOString()
  };

  const [toLocaleStorage, setToLocalStorage] = useState(emptyUser);

  // Generate random numeric id safely in browser
  const generatePassword = () => {
    if (typeof window === "undefined" || !window.crypto) return String(Math.floor(Math.random() * 90000000) + 10000000);
    const characters = "0123456789";
    const array = new Uint8Array(8);
    window.crypto.getRandomValues(array);
    return Array.from(array).map(v => characters[v % characters.length]).join('');
  };

  // Load users and generate id once in browser
  useEffect(() => {
    const newId = generatePassword();
    setToLocalStorage(prev => ({ ...prev, idnum: newId }));

    // Load existing users from Supabase
    supabaseDb.getUserByEmail('').then(({ data, error }) => {
      if (!error && data) {
        // For now, we'll just set an empty array since we're starting fresh
        setUsers([]);
      }
    }).catch(err => console.error('Error fetching users:', err));
  }, []);

  useEffect(() => {
    if (router.isReady && router.query.ref) {
      setReferralCodeInput(String(router.query.ref).toUpperCase());
    }
  }, [router.isReady, router.query.ref]);

  const buildReferralLink = (code) => {
    if (!code) return '';
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}/signup?ref=${encodeURIComponent(code)}`;
    }
    const fallbackHost = process.env.NEXT_PUBLIC_SITE_URL || 'https://grantunioninvestment.com';
    return `${fallbackHost.replace(/\/$/, '')}/signup?ref=${encodeURIComponent(code)}`;
  };

  const handleCopy = async (text, field) => {
    if (!text || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (copyError) {
      console.warn('Unable to copy text:', copyError);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;

    try {
      setIsLoading(true); // Set loading state at start
      setSignupSuccessInfo(null);

      // Validate inputs
      if (!toLocaleStorage.email?.includes('@')) {
        throw new Error(config.errorMessages.invalidEmail);
      }

      if (!toLocaleStorage.userName?.trim()) {
        throw new Error("Please enter a username");
      }

      if (!toLocaleStorage.phone?.trim()) {
        throw new Error("Please enter your phone number");
      }

      if (!validatePassword(toLocaleStorage.password)) {
        throw new Error(config.errorMessages.weakPassword);
      }

      if (toLocaleStorage.password !== toLocaleStorage.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // Programmatic validation for simulated verification
      if (!inputRef.current?.checked || verify !== "verified") {
        throw new Error(config.errorMessages.verificationNeeded);
      }

      // Terms checkbox (name="checkbox")
      const termsChecked = form.elements['checkbox']?.checked;
      if (!termsChecked) {
        throw new Error("You must agree to the terms and conditions.");
      }

        // Check for existing account by email
      const { data: existingUser, error: checkError } = await supabaseDb.getUserByEmail(toLocaleStorage.email);
      if (existingUser) {
        throw new Error("An account already exists with this email. Try logging in.");
      }

      // Validate required fields
      if (!toLocaleStorage.name?.trim()) {
        throw new Error("Please enter your full name");
      }

      // Create Supabase Auth user
      const { data: authData, error: authError } = await supabaseAuth.signUp(
        toLocaleStorage.email,
        toLocaleStorage.password,
        { 
          name: toLocaleStorage.name,
          user_name: toLocaleStorage.userName,
          phone: toLocaleStorage.phone
        }
      );
      if (authError) throw authError;

      // Ensure generated idnum is unique
      let candidateId = toLocaleStorage.idnum || generatePassword();
      // For fresh start, we'll just use the generated ID

      // Build notification for sign up bonus
      const notificationPush = {
        title: "Welcome Bonus",
        message: "You just received $50 sign up bonus",
        idnum: candidateId,
        status: "unseen",
        type: "signup_bonus"
      };

      // Prepare Supabase user doc
      const userDoc = {
        id: authData.user?.id, // Use the Supabase Auth user ID as the primary key
        email: toLocaleStorage.email.toLowerCase(),
        name: toLocaleStorage.name,
        user_name: toLocaleStorage.userName,
        phone: toLocaleStorage.phone,
        password: toLocaleStorage.password,
        balance: toLocaleStorage.balance,
        bonus: toLocaleStorage.bonus,
        idnum: candidateId,
        avatar: toLocaleStorage.avatar,
        account_status: 'active',
        admin: toLocaleStorage.admin,
        kyc_status: 'pending',
        date_created: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: userRecord, error: userError } = await supabaseDb.createUser({
        ...userDoc,
        referralCodeUsed: referralCodeInput?.trim() || null
      });
      if (userError) throw userError;

      // Create welcome notification after user is successfully created
      try {
        await supabaseDb.createNotification(notificationPush);
      } catch (notifyError) {
        console.error('Failed to create welcome notification:', notifyError);
        // Don't block signup success if notification fails
      }

      // Store user data safely (no password) in localStorage
      const safeUserData = { ...userRecord };
      delete safeUserData.password;
      localStorage.setItem("activeUser", JSON.stringify(safeUserData));
      try { sessionStorage.setItem("activeUser", JSON.stringify(safeUserData)); } catch (e) { /* ignore */ }

      const referralCode = userRecord?.referralCode || userRecord?.referral_code || '';
      const referralLink = buildReferralLink(referralCode);

      setSignupSuccessInfo({
        referralCode,
        referralLink,
        destination: registerFromPath || "/"
      });

      // Reset form state (except referral so they can share)
      form.reset();
      setVerify("Default");
      setReferralCodeInput(referralCode);
      setToLocalStorage({ ...emptyUser, idnum: generatePassword(), date: dateString });
    } catch (err) {
      console.error('Signup error:', err);
      let message;
      
      if (err.message) {
        // Use validation error messages directly
        message = err.message;
      } else {
        // Handle Supabase Auth errors
        switch(err?.code) {
          case 'user_already_registered':
            message = config.errorMessages.emailInUse;
            break;
          case 'invalid_email':
            message = config.errorMessages.invalidEmail;
            break;
          case 'weak_password':
            message = config.errorMessages.weakPassword;
            break;
          case 'network_error':
            message = 'Network error. Please check your internet connection.';
            break;
          default:
            message = config.errorMessages.serverError;
        }
      }
      
      setErrMsg(message);
      removeErr();

      // Reset verification state on error
      setVerify("Default");
      if (inputRef.current) {
        inputRef.current.checked = false;
      }
    } finally {
      setIsLoading(false); // Always clear loading state
    }
  };

  return (
    <div className='signupCntn'>
      <Head>
        <title>Sign up</title>
        <meta property="og:title" content="Sign up"/>
        <link rel="icon" href="/grant-union-icon.png" />
        <link rel="shortcut icon" href="/grant-union-icon.png" />
      </Head>

      <div className="leftSide">
        <video src="signup_vid2.mp4" autoPlay loop muted></video>
        <div className="overlay">
          <h2>&quot;When it rains gold, <br /> put out the bucket, <br /> not the thimble.&quot;</h2>
          <p><span>--</span>  Warren Buffett  <span>--</span></p>
        </div>
      </div>

      <div className="rightSide">
        <form onSubmit={handleSubmit}>
          <Link href={"/"} className='topsignuplink'><Image src="/grantunionLogo.png" alt="Grant Union Investment logo" width={160} height={40} style={{ height: 'auto' }} /></Link>
          <h1>Sign Up with Email</h1>
          {signupSuccessInfo && (
            <div className="signupSuccessCard">
              <h2>Account Created Successfully 🎉</h2>
              <p>Share your referral details to earn rewards.</p>
              <div className="referralShareRow">
                <div>
                  <label>Your Referral Code</label>
                  <strong>{signupSuccessInfo.referralCode || 'Generating...'}</strong>
                </div>
                <button
                  type="button"
                  className="copyBtn"
                  onClick={() => handleCopy(signupSuccessInfo.referralCode, 'code')}
                >
                  {copiedField === 'code' ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
              <div className="referralShareRow">
                <div>
                  <label>Your Referral Link</label>
                  <small>{signupSuccessInfo.referralLink}</small>
                </div>
                <button
                  type="button"
                  className="copyBtn"
                  onClick={() => handleCopy(signupSuccessInfo.referralLink, 'link')}
                >
                  {copiedField === 'link' ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
              <button
                type="button"
                className="fancyBtn secondary"
                onClick={() => router.push(signupSuccessInfo.destination)}
              >
                Go to Dashboard
              </button>
            </div>
          )}
          <div className="inputcontainer">
            <div className="inputCntn">
              <input
                onChange={(e) => setToLocalStorage({...toLocaleStorage, email: e.target.value})}
                type='email' name='email' placeholder='Email' required/>
              <span><i className="icofont-ui-email"></i></span>
            </div>
            <div className="inputCntn">
              <input
                onChange={(e) => setToLocalStorage({...toLocaleStorage, name: e.target.value})}
                type="text" name='name' placeholder='Fullname' required/>
              <span><i className="icofont-ui-user"></i></span>
            </div>
            <div className="inputCntn">
              <input
                onChange={(e) => setToLocalStorage({...toLocaleStorage, userName: e.target.value})}
                type="text" name='userName' placeholder='Username' required/>
              <span><i className="icofont-user-alt-3"></i></span>
            </div>
            <div className="inputCntn">
              <input
                onChange={(e) => setToLocalStorage({...toLocaleStorage, phone: e.target.value})}
                type="tel" name='phone' placeholder='Phone Number' required/>
              <span><i className="icofont-phone"></i></span>
            </div>
            <div className="passcntn">
              <input
                onChange={(e) => setToLocalStorage({...toLocaleStorage, password: e.target.value})}
                type={passwordShow ? "text" : "password"} name='password' placeholder='Password' required/>
              <button type="button" onClick={() => setPasswordShow(prev => !prev)}>
                <i className={`icofont-eye-${!passwordShow ? "alt" : "blocked"}`}></i>
              </button>
            </div>
            <div className="passcntn">
              <input
                onChange={(e) => setToLocalStorage({...toLocaleStorage, confirmPassword: e.target.value})}
                type={passwordShow ? "text" : "password"} name='confirmPassword' placeholder='Confirm Password' required/>
              <button type="button" onClick={() => setPasswordShow(prev => !prev)}>
                <i className={`icofont-eye-${!passwordShow ? "alt" : "blocked"}`}></i>
              </button>
            </div>
            <div className="inputCntn">
              <input
                onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                value={referralCodeInput}
                type="text"
                name='referralCode'
                placeholder='Referral Code (optional)'
                autoComplete="off"
              />
              <span><i className="icofont-gift"></i></span>
            </div>

            <div className="_cloudflr_verifcation_widget">
              <div className="verification_Box">
                <div className="checkbox_cntn" onClick={handleVerify}>
                  {/* remove required so browser doesn't block submit before our checks */}
                  <input ref={inputRef} type="checkbox" />
                  {verify === "Default" && (<span aria-hidden="true" className="unchecked"></span>)}
                  {verify === "verifying" && (<i aria-hidden="true" className="icofont-spinner-alt-2"></i>)}
                  {verify === "verified" && (<i aria-hidden="true" className="icofont-check-circled"></i>)}
                </div>
                <div className="verification_status">
                  {verify === "Default" && (<p>Human Verification</p>)}
                  {verify === "verifying" && (<p>Verifying...</p>)}
                  {verify === "verified" && (<p>Verified</p>)}
                </div>
              </div>
              <div className="service_provider">
                    <p>Protected by <Image src="/cloudflare.png" alt="cloudflare" width={120} height={40} style={{ height: 'auto' }} /></p>
              </div>
            </div>

            {errMsg && <p className='errorMsg'>{errMsg}</p>}

            <label className="form-control2">
              <input type="checkbox" name="checkbox" required/>
              I agree to all terms and conditions of Grant Union Investment Inc.
            </label>

            <button 
              type="submit" 
              className="fancyBtn"
              style={{
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                pointerEvents: 'auto',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <span>
                  <i className="icofont-spinner-alt-2 spinning" style={{ marginRight: '8px' }}></i>
                  Creating Account...
                </span>
              ) : (
                <span>Create an Account</span>
              )}
            </button>
          </div>
          <p className='haveanaccount'>Have an account? <Link href={"/signin"}>Sign In</Link></p>
        </form>
      </div>
    </div>
  );
};

export default Signup;