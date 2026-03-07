/**
 * Subscriptions List Page
 * Display all subscriptions with options to edit, delete, and mark as paid
 * Supports category-specific cards for Insurance, Internet, Loan, Subscription
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { subscriptionAPI } from '../services/api';
import { Edit2, Trash2, CheckCircle, AlertCircle, Wifi, Shield, CreditCard, Tv, FileText, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';

const SubscriptionsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const urlFilter = new URLSearchParams(location.search).get('filter');
  const urlCategory = new URLSearchParams(location.search).get('category');
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [payingId, setPayingId] = useState(null);
  const [historyOpenId, setHistoryOpenId] = useState(null);
  const [filter, setFilter] = useState(urlFilter || 'all');
  const [categoryFilter, setCategoryFilter] = useState(urlCategory || 'all');

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await subscriptionAPI.getAll();
        if (response.data.success) {
          setSubscriptions(response.data.subscriptions || []);
        } else {
          setSubscriptions([]);
        }
      } catch (err) {
        console.error('Failed to load subscriptions:', err);
        setError(err.response?.data?.message || 'Failed to load subscriptions');
        setSubscriptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  // Filter subscriptions based on category and status
  const filteredSubscriptions = subscriptions.filter(sub => {
    const dueDate = new Date(sub.nextDueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    // Category filter
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'Subscription' && sub.category !== 'Subscription') return false;
      if (categoryFilter === 'Loan' && sub.category !== 'Loan') return false;
      if (categoryFilter === 'Insurance' && sub.category !== 'Insurance') return false;
      if (categoryFilter === 'Internet' && sub.category !== 'Internet') return false;
      if (categoryFilter === 'Other' && sub.category !== 'Other') return false;
    }

    // Status filter
    if (filter === 'overdue') {
      return dueDate < today && sub.status !== 'Expired' && sub.status !== 'Completed';
    }

    if (filter === 'due') {
      const in7Days = new Date();
      in7Days.setDate(today.getDate() + 7);
      return dueDate >= today && dueDate <= in7Days && sub.status !== 'Expired';
    }

    if (filter === 'active') {
      return sub.status !== 'Expired' && sub.status !== 'Completed';
    }

    if (filter === 'inactive') {
      return sub.status === 'Expired' || sub.status === 'Completed';
    }

    return true;
  });

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      try {
        const response = await subscriptionAPI.delete(id);
        if (response.data.success) {
          setSubscriptions(subscriptions.filter(sub => sub._id !== id));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete subscription');
      }
    }
  };

  const handlePayBill = async (sub) => {
    if (payingId) return;
    setPayingId(sub._id);
    setError('');
    setSuccessMsg('');
    try {
      let response;
      if (sub.category === 'Loan') {
        response = await subscriptionAPI.payEMI(sub._id);
      } else {
        response = await subscriptionAPI.payBill(sub._id);
      }
      if (response.data.success) {
        const updated = response.data.data;
        setSubscriptions(prev => prev.map(s => s._id === updated._id ? updated : s));
        setSuccessMsg(`✅ Payment recorded for ${sub.name}. Next due: ${new Date(updated.nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setPayingId(null);
    }
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Insurance': return <Shield size={20} className="text-orange-600" />;
      case 'Internet': return <Wifi size={20} className="text-purple-600" />;
      case 'Loan': return <CreditCard size={20} className="text-teal-600" />;
      case 'Subscription': return <Tv size={20} className="text-blue-600" />;
      default: return <FileText size={20} className="text-gray-600" />;
    }
  };

  // Get card class (neutral — no category-specific borders)
  const getCardClass = (_category) => {
    return '';
  };

  // Check if overdue
  const isOverdue = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Bills & Subscriptions</h1>
          <p className="text-gray-500 mt-2">Manage all your subscriptions, loans, insurance, and internet bills</p>
        </div>
        <button
          onClick={() => navigate('/subscriptions/add')}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          Add New
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl mb-6">
          {successMsg}
        </div>
      )}

      {/* Category Tabs */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-3 font-semibold">Category</p>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'all', label: 'All', icon: null },
            { value: 'Subscription', label: 'Subscriptions', icon: <Tv size={16} /> },
            { value: 'Loan', label: 'Loans', icon: <CreditCard size={16} /> },
            { value: 'Insurance', label: 'Insurance', icon: <Shield size={16} /> },
            { value: 'Internet', label: 'Internet', icon: <Wifi size={16} /> },
            { value: 'Other', label: 'Other', icon: <FileText size={16} /> }
          ].map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                categoryFilter === cat.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-8">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-3 font-semibold">Status</p>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'due', label: 'Due Soon' },
            { value: 'overdue', label: 'Overdue' },
            { value: 'inactive', label: 'Inactive' }
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === f.value
                  ? f.value === 'overdue' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions List */}
      {filteredSubscriptions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl text-center py-16">
          <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600 text-lg font-medium">No subscriptions found</p>
          <p className="text-gray-500 mt-1">Create your first subscription to get started</p>
          <button
            onClick={() => navigate('/subscriptions/add')}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors mt-6 inline-block"
          >
            Add Subscription
          </button>
        </div>
      ) : (
        <div className="grid gap-5">
          {filteredSubscriptions.map((sub) => (
            <div key={sub._id} className={`bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all ${getCardClass(sub.category)}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {/* Header with icon and name */}
                  <div className="flex items-center gap-3 mb-3">
                    {getCategoryIcon(sub.category)}
                    <h3 className="text-xl font-bold text-gray-900">{sub.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      sub.status === 'Completed' ? 'bg-green-100 text-green-700'
                      : sub.status === 'Expired' ? 'bg-gray-100 text-gray-700'
                      : isOverdue(sub.nextDueDate) ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                    }`}>
                      {sub.status === 'Completed' ? 'Completed' 
                        : sub.status === 'Expired' ? 'Expired'
                        : isOverdue(sub.nextDueDate) ? 'Overdue'
                        : 'Active'}
                    </span>
                  </div>

                  {/* Category-specific display */}
                  {sub.category === 'Insurance' ? (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Premium</p>
                        <p className="font-bold text-gray-900 text-lg">₹{Number(sub.amount).toLocaleString('en-IN')}</p>
                        <p className="text-gray-500 text-xs">/ year</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Expires</p>
                        <p className="font-bold text-gray-900 text-lg">
                          {new Date(sub.expiryDate || sub.nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Coverage</p>
                        <p className="font-bold text-gray-900 text-lg">₹{sub.coverageAmount ? Number(sub.coverageAmount).toLocaleString('en-IN') : '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Provider</p>
                        <p className="font-bold text-gray-900 text-lg">{sub.provider || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Policy #</p>
                        <p className="font-bold text-gray-900 text-sm">{sub.policyNumber || '-'}</p>
                      </div>
                    </div>
                  ) : sub.category === 'Internet' ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Monthly</p>
                        <p className="font-bold text-gray-900 text-lg">₹{Number(sub.amount).toLocaleString('en-IN')}</p>
                        <p className="text-gray-500 text-xs">/ month</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Provider</p>
                        <p className="font-bold text-gray-900 text-lg">{sub.provider || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Next Bill</p>
                        <p className="font-bold text-gray-900 text-lg">
                          {new Date(sub.nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ) : sub.category === 'Loan' ? (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">EMI</p>
                        <p className="font-bold text-gray-900 text-lg">₹{Number(sub.emiAmount || sub.amount).toLocaleString('en-IN')}</p>
                        <p className="text-gray-500 text-xs">/ month</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Remaining</p>
                        <p className="font-bold text-teal-600 text-lg">₹{Number(sub.remainingAmount || 0).toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Total</p>
                        <p className="font-bold text-gray-900 text-lg">₹{Number(sub.totalAmount || 0).toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Progress</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-teal-500 h-full rounded-full" 
                            style={{width: `${Math.round(((sub.totalAmount - sub.remainingAmount) / sub.totalAmount) * 100) || 0}%`}}
                          ></div>
                        </div>
                        <p className="text-gray-700 text-xs mt-1">{Math.round(((sub.totalAmount - sub.remainingAmount) / sub.totalAmount) * 100) || 0}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Next EMI</p>
                        <p className="font-bold text-gray-900 text-lg">
                          {new Date(sub.nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Amount</p>
                        <p className="font-bold text-gray-900 text-lg">₹{Number(sub.amount).toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Cycle</p>
                        <p className="font-bold text-gray-900 text-lg">{sub.cycle}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Category</p>
                        <p className="font-bold text-gray-900 text-lg">{sub.category}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Next Due</p>
                        <p className="font-bold text-gray-900 text-lg">
                          {new Date(sub.nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-6">
                  {sub.status !== 'Completed' && sub.status !== 'Expired' && (
                    <button
                      onClick={() => handlePayBill(sub)}
                      disabled={payingId === sub._id}
                      title="Pay Bill"
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                        payingId === sub._id
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      <DollarSign size={16} />
                      {payingId === sub._id ? 'Paying...' : 'Pay'}
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/subscriptions/${sub._id}/edit`)}
                    title="Edit"
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(sub._id)}
                    title="Delete"
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              {/* Payment History Panel */}
              {sub.paymentHistory && sub.paymentHistory.length > 0 && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <button
                    onClick={() => setHistoryOpenId(historyOpenId === sub._id ? null : sub._id)}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {historyOpenId === sub._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    Payment History ({sub.paymentHistory.length})
                  </button>

                  {historyOpenId === sub._id && (
                    <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
                      {[...sub.paymentHistory].reverse().map((p, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle size={14} className="text-green-500 shrink-0" />
                            <span className="text-sm text-gray-700">
                              {new Date(p.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">₹{Number(p.amount).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubscriptionsList;
