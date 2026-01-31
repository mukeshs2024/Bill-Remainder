/**
 * Subscriptions List Page
 * Display all subscriptions with options to edit, delete, and mark as paid
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionAPI } from '../services/api';
import { Edit2, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

const SubscriptionsList = () => {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError('');
      const isActive = filter === 'active' ? true : filter === 'inactive' ? false : undefined;
      const response = await subscriptionAPI.getAll(isActive);
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

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      try {
        const response = await subscriptionAPI.delete(id);
        if (response.data.success) {
          setSubscriptions(subscriptions.filter(sub => sub.id !== id));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete subscription');
      }
    }
  };

  const handleMarkAsPaid = async (id) => {
    try {
      const response = await subscriptionAPI.markAsPaid(id);
      if (response.data.success) {
        setSubscriptions(subscriptions.map(sub =>
          sub.id === id ? { ...sub, ...response.data.data } : sub
        ));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark as paid');
    }
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Subscriptions</h1>
        <button
          onClick={() => navigate('/subscriptions/add')}
          className="btn-primary"
        >
          + Add Subscription
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex gap-2">
          {['all', 'active', 'inactive'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions List */}
      {subscriptions.length === 0 ? (
        <div className="card text-center py-12">
          <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600 text-lg">No subscriptions found</p>
          <button
            onClick={() => navigate('/subscriptions/add')}
            className="btn-primary mt-4"
          >
            Add your first subscription
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {subscriptions.map((sub) => (
            <div key={sub.id} className="card flex justify-between items-start hover:shadow-lg transition-shadow">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-800">{sub.serviceName}</h3>
                  <span className={`badge ${sub.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {sub.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {sub.isPaid && <span className="badge badge-success">Paid</span>}
                </div>
                <p className="text-gray-600 text-sm mb-3">{sub.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Amount</p>
                    <p className="font-bold text-gray-800">₹{sub.amount}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Cycle</p>
                    <p className="font-bold text-gray-800">{sub.billingCycle}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Category</p>
                    <p className="font-bold text-gray-800">{sub.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Next Due</p>
                    <p className="font-bold text-gray-800">
                      {new Date(sub.nextDueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 ml-4">
                {!sub.isPaid && (
                  <button
                    onClick={() => handleMarkAsPaid(sub.id)}
                    title="Mark as paid"
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                  >
                    <CheckCircle size={20} />
                  </button>
                )}
                <button
                  onClick={() => navigate(`/subscriptions/${sub.id}/edit`)}
                  title="Edit"
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit2 size={20} />
                </button>
                <button
                  onClick={() => handleDelete(sub.id)}
                  title="Delete"
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubscriptionsList;
