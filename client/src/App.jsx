import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/clerk-react';
import axios from 'axios';

// Pages
import Dashboard from './pages/Dashboard';
import SubscriptionsList from './pages/SubscriptionsList';
import AddEditSubscription from './pages/AddEditSubscription';

const AppContent = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing user/token
    const storedToken = localStorage.getItem('token');
    
    if (storedToken) {
      try {
        // Set token in axios headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        console.log('✅ Token restored from localStorage');
      } catch (err) {
        console.error('Error restoring token:', err);
        localStorage.removeItem('token');
      }
    }
    
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div>
        {/* Clerk Signed Out - Show Clerk Sign In Page */}
        <SignedOut>
          <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-2">📊 Bill Reminder</h1>
              <p className="text-white mb-8 text-lg">Manage your subscriptions & bills</p>
              <div className="bg-white rounded-lg shadow-lg p-8">
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
          <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-md sticky top-0 z-50">
              <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-blue-600 cursor-pointer hover:text-blue-700">
                  📊 Bill Reminder
                </h1>
                <UserButton afterSignOutUrl="/" />
              </div>
            </nav>
              
            <main className="container mx-auto p-6 mt-4">
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/subscriptions" element={<SubscriptionsList />} />
                <Route path="/subscriptions/add" element={<AddEditSubscription />} />
                <Route path="/subscriptions/:id" element={<AddEditSubscription />} />
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
