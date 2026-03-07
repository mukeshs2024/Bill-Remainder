/**
 * Dashboard Page
 * Main dashboard showing overview of subscriptions, loans, insurance, internet, spending, and upcoming bills
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionAPI, dashboardAPI } from '../services/api';
import { TrendingUp, DollarSign, Clock, TrendingDown, CreditCard, Shield, Wifi, Calendar } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loanStats, setLoanStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        
        // Fetch subscriptions
        const response = await subscriptionAPI.getAll();
        const data = response.data.subscriptions || response.data;
        
        if (Array.isArray(data)) {
          calculateStats(data);
        } else {
          initializeStats();
        }

        // Fetch loan statistics
        try {
          const loanResponse = await dashboardAPI.getLoanDetails();
          if (loanResponse.data.success) {
            setLoanStats(loanResponse.data.loans);
          }
        } catch (loanErr) {
          console.log('Loan stats not available yet');
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
        initializeStats();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const initializeStats = () => {
    setStats({
      totalSubscriptions: 0,
      monthlyTotal: '0',
      upcomingBillsCount: 0,
      overdueBillsCount: 0,
      activeLoanCount: 0,
      totalOutstanding: 0,
      totalMonthlyEMI: 0,
      // Insurance stats
      activeInsuranceCount: 0,
      upcomingInsuranceRenewals: 0,
      // Internet stats
      activeInternetBills: 0,
      totalMonthlyUtilities: 0,
      upcomingBills: []
    });
  };

  const calculateStats = (subscriptions) => {
    // Filter active subscriptions (status !== 'Expired')
    const activeSubs = subscriptions.filter(s => s.status !== 'Expired' && s.category !== 'Loan' && s.category !== 'Insurance' && s.category !== 'Internet');
    const loans = subscriptions.filter(s => s.category === 'Loan' && s.status === 'Active');
    const insurances = subscriptions.filter(s => s.category === 'Insurance' && s.status !== 'Expired');
    const internetBills = subscriptions.filter(s => s.category === 'Internet' && s.status !== 'Expired');
    
    // Calculate monthly total (non-loan subscriptions only)
    const monthlyTotal = activeSubs.reduce(
      (sum, s) => sum + Number(s.amount || 0),
      0
    );

    // Calculate monthly EMI
    const totalMonthlyEMI = loans.reduce(
      (sum, l) => sum + Number(l.emiAmount || 0),
      0
    );

    // Calculate outstanding loan balance
    const totalOutstanding = loans.reduce(
      (sum, l) => sum + Number(l.remainingAmount || 0),
      0
    );

    // Calculate monthly utilities (Internet)
    const totalMonthlyUtilities = internetBills.reduce(
      (sum, i) => sum + Number(i.amount || 0),
      0
    );

    // Calculate insurance renewals within 30 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in30Days = new Date();
    in30Days.setDate(today.getDate() + 30);

    const upcomingInsuranceRenewals = insurances.filter(ins => {
      const expiryDate = new Date(ins.expiryDate || ins.nextDueDate);
      expiryDate.setHours(0, 0, 0, 0);
      return expiryDate >= today && expiryDate <= in30Days;
    }).length;

    // Calculate due soon and overdue
    const in7Days = new Date();
    in7Days.setDate(today.getDate() + 7);

    const dueSoon = subscriptions.filter(s => {
      const d = new Date(s.nextDueDate);
      return d >= today && d <= in7Days && s.status !== 'Completed';
    });

    const overdue = subscriptions.filter(s => {
      const d = new Date(s.nextDueDate);
      d.setHours(0, 0, 0, 0);
      return d < today && s.status !== 'Completed' && s.status !== 'Expired';
    });

    setStats({
      totalSubscriptions: activeSubs.length,
      monthlyTotal: monthlyTotal.toFixed(2),
      upcomingBillsCount: dueSoon.length,
      overdueBillsCount: overdue.length,
      activeLoanCount: loans.length,
      totalOutstanding: totalOutstanding.toFixed(2),
      totalMonthlyEMI: totalMonthlyEMI.toFixed(2),
      // Insurance stats
      activeInsuranceCount: insurances.length,
      upcomingInsuranceRenewals: upcomingInsuranceRenewals,
      // Internet stats
      activeInternetBills: internetBills.length,
      totalMonthlyUtilities: totalMonthlyUtilities.toFixed(2),
      upcomingBills: dueSoon.slice(0, 5).map(b => ({
        _id: b._id,
        name: b.name,
        category: b.category || 'Other',
        amount: b.category === 'Loan' ? b.emiAmount : b.amount,
        nextDueDate: b.nextDueDate
      }))
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="mb-10">
        <h1 className="text-5xl font-bold text-gray-900 tracking-tight">Welcome back, {user.firstName || user.username}!</h1>
        <p className="text-gray-500 mt-3 text-lg">Track your subscriptions and manage your spending</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Subscriptions */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-all hover:shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium tracking-wide">SUBSCRIPTIONS</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalSubscriptions || 0}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="text-blue-600" size={20} />
            </div>
          </div>
        </div>

        {/* Monthly Spending */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-green-300 transition-all hover:shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium tracking-wide">MONTHLY BILLS</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">₹{stats?.monthlyTotal || 0}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="text-green-600" size={20} />
            </div>
          </div>
        </div>

        {/* Active Loans */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-teal-300 transition-all hover:shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium tracking-wide">ACTIVE LOANS</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.activeLoanCount || 0}</p>
            </div>
            <div className="p-3 bg-teal-50 rounded-lg">
              <CreditCard className="text-teal-600" size={20} />
            </div>
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-orange-300 transition-all hover:shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium tracking-wide">OUTSTANDING</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">₹{stats?.totalOutstanding || 0}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <TrendingDown className="text-orange-600" size={20} />
            </div>
          </div>
        </div>

        {/* Monthly EMI */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-purple-300 transition-all hover:shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium tracking-wide">MONTHLY EMI</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">₹{stats?.totalMonthlyEMI || 0}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Clock className="text-purple-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Insurance & Internet Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Insurances */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all cursor-pointer"
          onClick={() => navigate('/subscriptions?category=Insurance')}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium tracking-wide">ACTIVE INSURANCES</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.activeInsuranceCount || 0}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <Shield className="text-slate-500" size={20} />
            </div>
          </div>
        </div>

        {/* Upcoming Insurance Renewals */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all cursor-pointer"
          onClick={() => navigate('/subscriptions?category=Insurance&filter=due')}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium tracking-wide">RENEWALS (30 days)</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.upcomingInsuranceRenewals || 0}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <Calendar className="text-slate-500" size={20} />
            </div>
          </div>
        </div>

        {/* Internet Bills */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all cursor-pointer"
          onClick={() => navigate('/subscriptions?category=Internet')}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium tracking-wide">INTERNET BILLS</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.activeInternetBills || 0}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <Wifi className="text-slate-500" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Bills Section */}
      {stats?.upcomingBills?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Bills</h2>
          <div className="space-y-3">
            {stats.upcomingBills.map((bill) => (
              <div key={bill._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100">
                <div className="flex items-center gap-3">
                  {bill.category === 'Insurance' && <Shield size={18} className="text-orange-600" />}
                  {bill.category === 'Internet' && <Wifi size={18} className="text-purple-600" />}
                  {bill.category === 'Loan' && <CreditCard size={18} className="text-teal-600" />}
                  {!['Insurance', 'Internet', 'Loan'].includes(bill.category) && <DollarSign size={18} className="text-blue-600" />}
                  <div>
                    <p className="font-semibold text-gray-900">{bill.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{bill.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-lg">₹{bill.amount}</p>
                  <p className="text-sm text-gray-500 mt-1">{new Date(bill.nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {stats?.categoryBreakdown?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Spending by Category</h2>
          <div className="space-y-5">
            {stats.categoryBreakdown.map((cat) => (
              <div key={cat._id}>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-gray-700 font-semibold">{cat._id}</p>
                  <p className="text-gray-900 font-bold">₹{cat.total}</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-blue-500 h-2 rounded-full" 
                    style={{width: `${(cat.total / (stats.monthlyTotal || 1)) * 100}%`}}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-3 pt-4 flex-wrap">
        <button
          onClick={() => navigate('/subscriptions/add')}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Subscription
        </button>
        <button
          onClick={() => navigate('/subscriptions/add?category=Loan')}
          className="px-5 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          Add Loan
        </button>
        <button
          onClick={() => navigate('/subscriptions/add?category=Insurance')}
          className="px-5 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          Add Insurance
        </button>
        <button
          onClick={() => navigate('/subscriptions/add?category=Internet')}
          className="px-5 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          Add Internet
        </button>
        <button
          onClick={() => navigate('/subscriptions')}
          className="px-5 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          View All
        </button>
      </div>

      {/* Active Loans Section */}
      {loanStats && loanStats.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <CreditCard size={24} className="text-teal-600" />
            Active Loans
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loanStats.slice(0, 4).map((loan) => (
              <div
                key={loan._id}
                onClick={() => navigate(`/subscriptions/${loan._id}`)}
                className="p-6 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-base font-semibold text-gray-900">{loan.name}</h3>
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                    {loan.progress}%
                  </span>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">EMI Amount</span>
                    <span className="text-sm font-semibold text-gray-900">₹{loan.emiAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Remaining</span>
                    <span className="text-sm font-semibold text-gray-900">₹{loan.remainingAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${loan.progress}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  Next EMI: {new Date(loan.nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            ))}
          </div>
          {loanStats.length > 4 && (
            <button
              onClick={() => navigate('/subscriptions?category=Loan')}
              className="mt-6 w-full py-2 px-4 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              View All {loanStats.length} Loans
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
