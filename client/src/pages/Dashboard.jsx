/**
 * Dashboard Page
 * Main dashboard showing overview of subscriptions, spending, and upcoming bills
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { AlertCircle, TrendingUp, DollarSign, Clock } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getStats();
      if (response.data.success) {
        setStats(response.data.stats);
      } else {
        // Set default stats if response indicates no data
        setStats({
          totalSubscriptions: 0,
          monthlyTotal: 0,
          upcomingBillsCount: 0,
          overdueBillsCount: 0
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Set default stats on error
      setStats({
        totalSubscriptions: 0,
        monthlyTotal: 0,
        upcomingBillsCount: 0,
        overdueBillsCount: 0
      });
      setError('');  // Don't show error, just use defaults
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Welcome, {user.firstName || user.username}!</h1>
        <p className="text-gray-600 mt-2">Here's your subscription overview for this month</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
          <AlertCircle className="mr-3 mt-1 flex-shrink-0" size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Subscriptions */}
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Subscriptions</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats?.totalSubscriptions || 0}</p>
            </div>
            <TrendingUp className="text-blue-600" size={24} />
          </div>
        </div>

        {/* Monthly Total */}
        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm font-medium">This Month Total</p>
              <p className="text-3xl font-bold text-green-600 mt-2">₹{stats?.monthlyTotal || 0}</p>
            </div>
            <DollarSign className="text-green-600" size={24} />
          </div>
        </div>

        {/* Upcoming Bills */}
        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm font-medium">Due in 7 Days</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats?.upcomingBillsCount || 0}</p>
            </div>
            <Clock className="text-yellow-600" size={24} />
          </div>
        </div>

        {/* Overdue Bills */}
        <div className="card bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm font-medium">Overdue</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats?.overdueBillsCount || 0}</p>
            </div>
            <AlertCircle className="text-red-600" size={24} />
          </div>
        </div>
      </div>

      {/* Upcoming Bills Section */}
      {stats?.upcomingBills?.length > 0 && (
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Upcoming Bills</h2>
          <div className="space-y-3">
            {stats.upcomingBills.map((bill) => (
              <div key={bill._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-semibold text-gray-800">{bill.serviceName}</p>
                  <p className="text-sm text-gray-600">{bill.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800">₹{bill.amount}</p>
                  <p className="text-sm text-gray-600">{new Date(bill.nextDueDate).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {stats?.categoryBreakdown?.length > 0 && (
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Spending by Category</h2>
          <div className="space-y-3">
            {stats.categoryBreakdown.map((cat) => (
              <div key={cat._id} className="flex justify-between items-center">
                <p className="text-gray-700 font-medium">{cat._id}</p>
                <div className="flex items-center gap-4">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{width: `${(cat.total / (stats.monthlyTotal || 1)) * 100}%`}}
                    ></div>
                  </div>
                  <p className="text-gray-800 font-semibold">₹{cat.total}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-4 pt-4">
        <button
          onClick={() => navigate('/subscriptions/add')}
          className="btn-primary"
        >
          + Add New Subscription
        </button>
        <button
          onClick={() => navigate('/subscriptions')}
          className="btn-secondary"
        >
          View All Subscriptions
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
