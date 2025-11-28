import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AnimatePresence } from 'framer-motion';
import ThemeProvider from '../../providers/ThemeProvider';
import '../styles/contact.css';
import '../styles/dashboard.css';
import '../styles/signup.css';
import '../styles/home.css';
import '../styles/global.css';
import '../i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';
import '../styles/admin-components.css';
import '../styles/admin-dashboard.css';
import ErrorBoundary from '../components/ErrorBoundary';
import { config } from '../utils/config';
import dynamic from 'next/dynamic';

// ChatBot is rendered only on the user dashboard (profile page).
// Moved rendering into the profile page so admin pages don't load the widget.

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const publicPaths = ['/signin', '/signin_admin', '/signup'];
  const [sessionInterval, setSessionInterval] = useState(null);

  // Auto Logout Logic
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    let timer;

    const handleLogout = () => {
      // Check if user is actually logged in before clearing/redirecting
      const user = localStorage.getItem('activeUser') || sessionStorage.getItem('activeUser');
      if (!user) return;

      console.log('Auto logging out due to inactivity');
      localStorage.clear();
      sessionStorage.clear();
      
      // Redirect based on current path
      if (window.location.pathname.includes('admin')) {
           window.location.href = '/signin_admin';
      } else {
           window.location.href = '/signin';
      }
    };

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(handleLogout, 30 * 60 * 1000); // 30 minutes
    };

    // Initialize timer
    resetTimer();

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    // Cleanup
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, []);

  // Disable all session and activity tracking to prevent signin conflicts

  // Disable automatic route guard to prevent signin conflicts
  // Individual pages will handle their own auth checks if needed

  return (
    <ThemeProvider>
      <Head>
        <title>Grant Union Investment</title>
        <meta charSet="UTF-8"/>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>
        <meta name="theme-color" content='#1C0F36'/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <link rel="icon" href="/grant-union-icon.png"/>
        <link rel="apple-touch-icon" href="/grant-union-icon.png"/>
        <meta property="og:title" content="grantunionsmall.png"/>
        <meta property="og:description" content="Grant Union Investment is a trusted binary and cryptocurrency trading company delivering consistent, compliant returns."/>
      </Head>
      <AnimatePresence mode='wait'>
          <div className="app-wrapper" key="app-content">
          {/* ChatBot is rendered inside the user profile page only */}
          <Component {...pageProps} />
          <LanguageSwitcher />
        </div>
      </AnimatePresence>
    </ThemeProvider>
  );
}