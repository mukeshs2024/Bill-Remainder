/**
 * Payment History Page
 * Shows all past payments across all subscriptions, sorted by most recent.
 */

import React, { useState, useEffect } from 'react';
import { subscriptionAPI } from '../services/api';
import { CheckCircle, AlertCircle, Wifi, Shield, CreditCard, Tv, FileText } from 'lucide-react';

const categoryIcon = (category) => {
  switch (category) {
    case 'Insurance':    return <Shield size={16} className="text-orange-500" />;
    case 'Internet':     return <Wifi size={16} className="text-purple-500" />;
    case 'Loan':         return <CreditCard size={16} className="text-teal-500" />;
    case 'Subscription': return <Tv size={16} className="text-blue-500" />;
    default:             return <FileText size={16} className="text-gray-500" />;
  }
};

const categoryBadge = (category) => {
  const base = 'px-2 py-0.5 rounded-full text-xs font-semibold';
  switch (category) {
    case 'Insurance':    return `${base} bg-orange-100 text-orange-700`;
    case 'Internet':     return `${base} bg-purple-100 text-purple-700`;
    case 'Loan':         return `${base} bg-teal-100 text-teal-700`;
    case 'Subscription': return `${base} bg-blue-100 text-blue-700`;
    default:             return `${base} bg-gray-100 text-gray-700`;
  }
};

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await subscriptionAPI.getPaymentHistory();
        if (response.data.success) {
          setPayments(response.data.payments || []);
          setTotalPaid(response.data.totalPaid || 0);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load payment history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const categories = ['all', ...Array.from(new Set(payments.map(p => p.category)))];

  const filtered = payments.filter(p => {
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const filteredTotal = filtered.reduce((sum, p) => sum + p.amount, 0);

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
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Payment History</h1>
        <p className="text-gray-500 mt-2">All past payments across your bills and subscriptions</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Payments</p>
          <p className="text-3xl font-bold text-gray-900">{payments.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Amount Paid</p>
          <p className="text-3xl font-bold text-green-600">₹{totalPaid.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Showing</p>
          <p className="text-3xl font-bold text-blue-600">{filtered.length}</p>
          {categoryFilter !== 'all' || search ? (
            <p className="text-xs text-gray-500 mt-1">₹{filteredTotal.toLocaleString('en-IN')} filtered total</p>
          ) : null}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl text-center py-16">
          <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600 text-lg font-medium">No payments found</p>
          <p className="text-gray-500 mt-1">Payments appear here after you click "Pay" on any bill.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Service</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cycle</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Paid On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {categoryIcon(p.category)}
                        <span className="font-medium text-gray-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={categoryBadge(p.category)}>{p.category}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 capitalize">{p.cycle}</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      <div className="flex items-center justify-end gap-2">
                        <CheckCircle size={14} className="text-green-500" />
                        {new Date(p.paidAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={3} className="px-6 py-3 text-sm font-semibold text-gray-700">
                    {filtered.length} payment{filtered.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-gray-900">
                    ₹{filteredTotal.toLocaleString('en-IN')}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {filtered.map((p, i) => (
              <div key={i} className="px-4 py-4 flex justify-between items-start">
                <div className="flex items-start gap-3">
                  {categoryIcon(p.category)}
                  <div>
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={categoryBadge(p.category)}>{p.category}</span>
                      <span className="text-xs text-gray-500 capitalize">{p.cycle}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <CheckCircle size={12} className="text-green-500" />
                      {new Date(p.paidAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <p className="font-bold text-gray-900 text-base">₹{Number(p.amount).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
