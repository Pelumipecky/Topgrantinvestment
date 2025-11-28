import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { supabaseAuth } from '../database/supabaseUtils';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if we're in password reset mode (user clicked email link)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken && refreshToken) {
      setIsResetMode(true);
      // Set the session with the tokens from the URL
      supabaseAuth.setSession(accessToken, refreshToken);
    }
  }, []);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabaseAuth.resetPassword(email);
      if (error) throw error;

      setMessage('Password reset email sent! Check your inbox.');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabaseAuth.updatePassword(newPassword);
      if (error) throw error;

      setMessage('Password updated successfully! Redirecting...');
      setTimeout(() => {
        router.push('/signin');
      }, 2000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='signupCntn'>
      <div className='leftSide'>
        <video src='signup_vid2.mp4' autoPlay loop muted />
        <div className='overlay'>
          <h2>&quot;Security is not a product, <br /> but a process.&quot;</h2>
          <p><span>--</span> Bruce Schneier <span>--</span></p>
        </div>
      </div>
      <div className='rightSide'>
        <form onSubmit={isResetMode ? handleUpdatePassword : handleRequestReset}>
          <Link href='/' className='topsignuplink'>
            <Image src='/grantunionLogo.png' alt='Grant Union Investment logo' width={160} height={40} style={{ height: 'auto' }} />
          </Link>
          <h1>{isResetMode ? 'Set New Password' : 'Reset Password'}</h1>

          {!isResetMode ? (
            <div className='inputcontainer'>
              <div className='inputCntn'>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='Email Address'
                  required
                />
                <span><i className='icofont-ui-email'></i></span>
              </div>

              {error && <p className='errorMsg'>{error}</p>}
              {message && <p style={{ color: '#28a745', textAlign: 'center', margin: '10px 0' }}>{message}</p>}

              <button type="submit" className='fancyBtn' disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Email'}
              </button>
            </div>
          ) : (
            <div className='inputcontainer'>
              <div className='passcntn'>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder='New Password'
                  required
                  minLength="8"
                />
              </div>

              <div className='passcntn'>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder='Confirm New Password'
                  required
                  minLength="8"
                />
              </div>

              {error && <p className='errorMsg'>{error}</p>}
              {message && <p style={{ color: '#28a745', textAlign: 'center', margin: '10px 0' }}>{message}</p>}

              <button type="submit" className='fancyBtn' disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          )}

          <p className='haveanaccount'>
            <Link href='/signin'>Back to Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
}