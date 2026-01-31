/**
 * Add/Edit Subscription Page
 * Form for adding or editing subscription details
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { subscriptionAPI } from '../services/api';
import { ArrowLeft } from 'lucide-react';

const AddEditSubscription = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    serviceName: '',
    description: '',
    category: 'Subscription',
    amount: '',
    billingCycle: 'monthly',
    billingCycleDays: 30,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reminderDaysBefore: 3,
    paymentMethod: 'credit_card',
    phone: '',
    notes: '',
    currency: 'INR'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      fetchSubscription();
    }
  }, [id]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await subscriptionAPI.getById(id);
      if (response.data.success) {
        const sub = response.data.subscription;
        setFormData({
          ...sub,
          startDate: new Date(sub.startDate).toISOString().split('T')[0]
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.serviceName || !formData.amount) {
      setError('Service name and amount are required');
      return;
    }

    setLoading(true);

    try {
      const response = isEdit
        ? await subscriptionAPI.update(id, formData)
        : await subscriptionAPI.create(formData);

      if (response.data.success) {
        navigate('/subscriptions');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save subscription');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'OTT',
    'Utility',
    'Internet',
    'Loan',
    'Insurance',
    'Subscription',
    'Other'
  ];

  const paymentMethods = [
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'net_banking', label: 'Net Banking' },
    { value: 'upi', label: 'UPI' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/subscriptions')}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-gray-800">
          {isEdit ? 'Edit Subscription' : 'Add New Subscription'}
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Name */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Service Name *
            </label>
            <input
              type="text"
              name="serviceName"
              value={formData.serviceName}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., Netflix, Electricity Bill, Internet"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input-field min-h-24"
              placeholder="Add any notes about this subscription"
            />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input-field"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Amount *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="input-field"
                placeholder="0.00"
                step="0.01"
                required
              />
            </div>

            {/* Billing Cycle */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Billing Cycle *
              </label>
              <select
                name="billingCycle"
                value={formData.billingCycle}
                onChange={handleChange}
                className="input-field"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom Days</option>
              </select>
            </div>

            {/* Custom Days (if needed) */}
            {formData.billingCycle === 'custom' && (
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Billing Cycle Days
                </label>
                <input
                  type="number"
                  name="billingCycleDays"
                  value={formData.billingCycleDays}
                  onChange={handleChange}
                  className="input-field"
                  min="1"
                />
              </div>
            )}

            {/* Start Date */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Payment Method
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="input-field"
              >
                {paymentMethods.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reminder Days */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Remind me before (days)
              </label>
              <input
                type="number"
                name="reminderDaysBefore"
                value={formData.reminderDaysBefore}
                onChange={handleChange}
                className="input-field"
                min="1"
              />
            </div>

            {/* End Date (for WhatsApp reminders) */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Expiry Date (for reminders)
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            {/* WhatsApp Phone */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                WhatsApp Phone (E.164 format)
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
                placeholder="+919876543210"
              />
              <p className="text-sm text-gray-500 mt-1">e.g., +91 for India, +1 for USA</p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="input-field min-h-20"
              placeholder="Any additional notes..."
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Saving...' : isEdit ? 'Update Subscription' : 'Add Subscription'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/subscriptions')}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditSubscription;
