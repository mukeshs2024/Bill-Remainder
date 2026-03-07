import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, useAuth, useUser } from '@clerk/clerk-react';
import axios from 'axios';

// Components
import TopNavbar from './components/TopNavbar';

// Pages
import Dashboard from './pages/Dashboard';
import SubscriptionsList from './pages/SubscriptionsList';
import AddEditSubscription from './pages/AddEditSubscription';
import PaymentHistory from './pages/PaymentHistory';

const AppContent = () => {
  const { user: clerkUser, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);

  // Sync Clerk user with backend
  useEffect(() => {
    const syncClerkUser = async () => {
      if (!isLoaded) return;
      
      // Check for existing stored token first
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        console.log('✅ Token restored from localStorage');
        setLoading(false);
        return;
      }

      // If Clerk user is signed in but no token, get token from backend
      if (clerkUser) {
        try {
          const token = await getToken();
          const response = await axios.post(
            `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/auth/verify-clerk`,
            {
              clerkToken: token,
              clerkUserId: clerkUser.id,
              email: clerkUser.primaryEmailAddress?.emailAddress,
              firstName: clerkUser.firstName,
              lastName: clerkUser.lastName
            }
          );

          if (response.data.success) {
            const backendToken = response.data.token;
            const userData = response.data.user;
            
            // Store token and user info
            localStorage.setItem('token', backendToken);
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Set authorization header
            axios.defaults.headers.common['Authorization'] = `Bearer ${backendToken}`;
            
            console.log('✅ Synced with Clerk and received backend token');
          }
        } catch (err) {
          console.error('Error syncing Clerk user:', err);
        }
      }
      
      setLoading(false);
    };

    syncClerkUser();
  }, [clerkUser, isLoaded, getToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm font-medium tracking-wide">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true }}>
      <div>
        {/* Clerk Signed Out - Show Clerk Sign In Page */}
        <SignedOut>
          <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
            <div className="w-full max-w-sm text-center">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-5">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Bill Reminder</h1>
                <p className="text-slate-400 mt-2 text-sm">Track subscriptions & bills in one place</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                <SignInButton
                  mode="modal"
                  forceRedirectUrl="/dashboard"
                />
              </div>
            </div>
          </div>
        </SignedOut>

        {/* Clerk Signed In - Show App */}
        <SignedIn>
          <div className="min-h-screen bg-gray-50">
            <TopNavbar />
              
            <main className="container mx-auto px-4 md:px-6 py-6">
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/subscriptions" element={<SubscriptionsList />} />
                <Route path="/subscriptions/add" element={<AddEditSubscription />} />
                <Route path="/subscriptions/:id/edit" element={<AddEditSubscription />} />
                <Route path="/payments" element={<PaymentHistory />} />
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </main>
          </div>
        </SignedIn>
      </div>
    </BrowserRouter>
  );
};

export default AppContent;
