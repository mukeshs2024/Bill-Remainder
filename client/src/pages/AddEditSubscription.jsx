/**
 * Professional Bill Reminder - Add/Edit Subscription
 * Enhanced with Loan management and category-specific logic
 * 
 * Supports:
 * - Subscriptions (recurring)
 * - Loans (amortized with EMI tracking)
 * - Insurance (annual renewal)
 * - Internet/Telecom (auto-monthly)
 * - Other (manual reminders)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { subscriptionAPI } from '../services/api';
import { ArrowLeft, AlertCircle, Check, Calendar, Bell, MessageCircle, Eye } from 'lucide-react';

const AddEditSubscription = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  // Get category from URL params for pre-selection
  const urlParams = new URLSearchParams(window.location.search);
  const urlCategory = urlParams.get('category');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: urlCategory && ['Internet', 'Loan', 'Insurance', 'Subscription', 'Other'].includes(urlCategory) 
      ? urlCategory 
      : 'Subscription',
    amount: '',
    cycle: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date().toISOString().split('T')[0],
    remindBefore: 3,
    whatsappPhone: '',
    paymentMethod: 'credit_card',
    notes: '',
    // LOAN-SPECIFIC FIELDS
    totalAmount: '',
    emiAmount: '',
    tenureMonths: '',
    // INSURANCE-SPECIFIC FIELDS
    provider: '',
    policyNumber: '',
    coverageAmount: '',
    // INTERNET-SPECIFIC FIELDS
    planName: '',
    speedMbps: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enableWhatsApp, setEnableWhatsApp] = useState(false);

  const categories = ['Internet', 'Loan', 'Insurance', 'Subscription', 'Other'];
  const paymentMethods = [
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'upi', label: 'UPI' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cash', label: 'Cash' }
  ];

  // Fetch subscription for editing
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        const response = await subscriptionAPI.getById(id);
        if (response.data.success) {
          const sub = response.data.subscription;
          setFormData({
            name: sub.name || '',
            description: sub.description || '',
            category: sub.category || 'Subscription',
            amount: sub.amount || '',
            cycle: sub.cycle || 'monthly',
            startDate: new Date(sub.startDate).toISOString().split('T')[0],
            expiryDate: sub.expiryDate ? new Date(sub.expiryDate).toISOString().split('T')[0] : '',
            remindBefore: sub.remindBefore || 3,
            whatsappPhone: sub.whatsappPhone || '',
            paymentMethod: sub.paymentMethod || 'credit_card',
            notes: sub.notes || '',
            // LOAN FIELDS
            totalAmount: sub.totalAmount || '',
            emiAmount: sub.emiAmount || '',
            tenureMonths: sub.tenureMonths || '',
            // INSURANCE FIELDS
            provider: sub.provider || '',
            policyNumber: sub.policyNumber || '',
            coverageAmount: sub.coverageAmount || '',
            // INTERNET FIELDS
            planName: sub.planName || '',
            speedMbps: sub.speedMbps || ''
          });
          setEnableWhatsApp(!!sub.whatsappPhone);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load subscription');
      } finally {
        setLoading(false);
      }
    };

    if (isEdit) {
      fetchSubscription();
    }
  }, [isEdit, id]);

  // Category-driven cycle override
  useEffect(() => {
    let newCycle = formData.cycle;

    if (formData.category === 'Internet' || formData.category === 'Loan') {
      newCycle = 'monthly';
    } else if (formData.category === 'Insurance') {
      newCycle = 'yearly';
    }

    setFormData(prev => ({
      ...prev,
      cycle: newCycle
    }));
  }, [formData.category, formData.cycle]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleWhatsAppToggle = () => {
    if (!enableWhatsApp) {
      setEnableWhatsApp(true);
    } else {
      setEnableWhatsApp(false);
      setFormData(prev => ({
        ...prev,
        whatsappPhone: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.name || !formData.category || !formData.startDate) {
      setError('Please fill all required fields');
      return;
    }

    // Category-specific validation
    if (formData.category === 'Loan') {
      if (!formData.totalAmount || !formData.emiAmount || !formData.tenureMonths) {
        setError('Loan requires: Total Amount, Monthly EMI, and Tenure');
        return;
      }
    } else if (formData.category === 'Insurance') {
      if (!formData.expiryDate) {
        setError('Insurance requires: Expiry Date');
        return;
      }
      if (!formData.amount) {
        setError('Insurance premium amount is required');
        return;
      }
    } else if (formData.category === 'Internet') {
      if (!formData.amount) {
        setError('Internet monthly amount is required');
        return;
      }
    } else {
      if (!formData.amount) {
        setError('Amount is required');
        return;
      }
    }

    if (enableWhatsApp && !formData.whatsappPhone) {
      setError('Please enter WhatsApp phone number');
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        cycle: formData.cycle,
        startDate: formData.startDate,
        expiryDate: formData.expiryDate || null,
        remindBefore: formData.remindBefore,
        whatsappPhone: enableWhatsApp ? formData.whatsappPhone : null,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes
      };

      // Add category-specific fields
      if (formData.category === 'Loan') {
        submitData.totalAmount = Number(formData.totalAmount);
        submitData.emiAmount = Number(formData.emiAmount);
        submitData.tenureMonths = Number(formData.tenureMonths);
      } else if (formData.category === 'Insurance') {
        submitData.amount = Number(formData.amount);
        submitData.provider = formData.provider;
        submitData.policyNumber = formData.policyNumber;
        submitData.coverageAmount = Number(formData.coverageAmount);
      } else if (formData.category === 'Internet') {
        submitData.amount = Number(formData.amount);
        submitData.provider = formData.provider;
        submitData.planName = formData.planName;
        submitData.speedMbps = Number(formData.speedMbps);
      } else {
        submitData.amount = Number(formData.amount);
      }

      const response = isEdit
        ? await subscriptionAPI.update(id, submitData)
        : await subscriptionAPI.create(submitData);

      if (response.data.success) {
        navigate('/subscriptions');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save subscription');
    } finally {
      setLoading(false);
    }
  };

  // Calculate loan end date preview
  const calculateLoanEndDate = () => {
    if (!formData.startDate || !formData.tenureMonths) return null;
    const date = new Date(formData.startDate);
    const months = parseInt(formData.tenureMonths);
    
    const day = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + months);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    date.setDate(Math.min(day, lastDay));
    
    return date;
  };

  // Calculate next due date preview
  const getNextDueDate = () => {
    if (!formData.startDate) return null;
    const date = new Date(formData.startDate);
    
    if (formData.cycle === 'monthly') {
      date.setMonth(date.getMonth() + 1);
    } else if (formData.cycle === 'quarterly') {
      date.setMonth(date.getMonth() + 3);
    } else if (formData.cycle === 'yearly') {
      date.setFullYear(date.getFullYear() + 1);
    }
    
    return date;
  };

  const nextDueDate = getNextDueDate();
  const loanEndDate = formData.category === 'Loan' ? calculateLoanEndDate() : null;
  const cycleLabel = {
    monthly: 'month',
    quarterly: '3 months',
    yearly: 'year'
  };

  // Calculate loan metrics for preview
  const loanMetrics = formData.category === 'Loan' && formData.totalAmount && formData.emiAmount ? {
    totalAmount: Number(formData.totalAmount),
    emiAmount: Number(formData.emiAmount),
    tenureMonths: Number(formData.tenureMonths),
    totalPayable: Number(formData.emiAmount) * Number(formData.tenureMonths)
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pb-32">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/subscriptions')}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit ' + formData.category : 'Add New ' + formData.category}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {formData.category === 'Loan' ? 'Manage your loan EMI payments' : 'Create a new bill reminder'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={20} />
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form - Left Section (2 cols on desktop) */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            {/* SECTION 1: Service Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                <h2 className="text-lg font-bold text-gray-900">Service Details</h2>
              </div>

              {/* Service Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={formData.category === 'Loan' ? 'e.g., Home Loan, Car Loan' : 'e.g., Netflix, Airtel WiFi'}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">Name of the {formData.category.toLowerCase()}</p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 bg-white"
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  {formData.category === 'Internet' && '📡 Monthly billing (fixed)'}
                  {formData.category === 'Loan' && '💰 EMI-based amortization'}
                  {formData.category === 'Insurance' && '🛡️ Annual renewal'}
                  {formData.category === 'Subscription' && '📺 Choose your cycle'}
                  {formData.category === 'Other' && '📌 Manual reminders'}
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Add details..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 resize-none"
                  rows="3"
                />
                <p className="text-xs text-gray-500 mt-2">Optional - add extra context</p>
              </div>
            </div>

            {/* SECTION 2: Billing Information (LOAN-SPECIFIC) */}
            {formData.category === 'Loan' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                  <h2 className="text-lg font-bold text-gray-900">Loan Details</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Total Loan Amount */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Total Loan Amount <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-gray-700 font-semibold">₹</span>
                      <input
                        type="number"
                        name="totalAmount"
                        value={formData.totalAmount}
                        onChange={handleChange}
                        placeholder="500000"
                        className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                        step="1000"
                        min="0"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Principal amount</p>
                  </div>

                  {/* Monthly EMI */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Monthly EMI <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-gray-700 font-semibold">₹</span>
                      <input
                        type="number"
                        name="emiAmount"
                        value={formData.emiAmount}
                        onChange={handleChange}
                        placeholder="10000"
                        className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                        step="100"
                        min="0"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Equated Monthly Installment</p>
                  </div>

                  {/* Tenure in Months */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tenure <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="tenureMonths"
                        value={formData.tenureMonths}
                        onChange={handleChange}
                        placeholder="60"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                        step="1"
                        min="1"
                        required
                      />
                      <span className="absolute right-4 top-3 text-gray-700 font-semibold">months</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Loan duration</p>
                  </div>
                </div>

                {/* Loan Info */}
                {loanMetrics && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Total Amount Payable:</span>
                      <span className="font-bold text-gray-900">₹{loanMetrics.totalPayable.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Total Interest:</span>
                      <span className="font-bold text-gray-900">₹{(loanMetrics.totalPayable - loanMetrics.totalAmount).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">EMI Duration:</span>
                      <span className="font-bold text-gray-900">{loanMetrics.tenureMonths} months ({Math.round(loanMetrics.tenureMonths / 12)} years)</span>
                    </div>
                  </div>
                )}

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Loan Start Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">When the loan EMI starts</p>
                </div>
              </div>
            )}

            {/* SECTION 2: Billing Information (NON-LOAN) */}
            {formData.category !== 'Loan' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                  <h2 className="text-lg font-bold text-gray-900">Billing Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-gray-700 font-semibold">₹</span>
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        placeholder="0"
                        className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                        step="0.01"
                        min="0"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Amount per billing cycle</p>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Billing start date</p>
                  </div>
                </div>

                {/* Billing Cycle - Only for Subscription & Other */}
                {(formData.category === 'Subscription' || formData.category === 'Other') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Billing Cycle
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['monthly', 'quarterly', 'yearly'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, cycle: c }))}
                          className={`py-3 px-4 rounded-xl border-2 font-semibold transition-all ${
                            formData.cycle === c
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {c === 'monthly' && 'Monthly'}
                          {c === 'quarterly' && 'Quarterly'}
                          {c === 'yearly' && 'Yearly'}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">How often this bill repeats</p>
                  </div>
                )}

                {/* INSURANCE-SPECIFIC FIELDS */}
                {formData.category === 'Insurance' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 space-y-4">
                    <h3 className="font-semibold text-orange-900 mb-4">Insurance Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Provider */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Provider
                        </label>
                        <input
                          type="text"
                          name="provider"
                          value={formData.provider}
                          onChange={handleChange}
                          placeholder="e.g., LIC, ICICI, HDFC"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900"
                        />
                        <p className="text-xs text-gray-500 mt-1">Insurance provider name</p>
                      </div>

                      {/* Policy Number */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Policy Number
                        </label>
                        <input
                          type="text"
                          name="policyNumber"
                          value={formData.policyNumber}
                          onChange={handleChange}
                          placeholder="Policy #"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900"
                        />
                        <p className="text-xs text-gray-500 mt-1">Your policy number</p>
                      </div>

                      {/* Coverage Amount */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Coverage Amount
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-3 text-gray-700 font-semibold">₹</span>
                          <input
                            type="number"
                            name="coverageAmount"
                            value={formData.coverageAmount}
                            onChange={handleChange}
                            placeholder="500000"
                            className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900"
                            step="10000"
                            min="0"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Total coverage amount</p>
                      </div>

                      {/* Expiry Date - MANDATORY FOR INSURANCE */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Expiry Date <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Calendar size={18} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
                          <input
                            type="date"
                            name="expiryDate"
                            value={formData.expiryDate}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900"
                            required
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Policy renewal date</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* INTERNET-SPECIFIC FIELDS */}
                {formData.category === 'Internet' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 space-y-4">
                    <h3 className="font-semibold text-purple-900 mb-4">Internet Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Provider */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Provider
                        </label>
                        <input
                          type="text"
                          name="provider"
                          value={formData.provider}
                          onChange={handleChange}
                          placeholder="e.g., Jio, Airtel, ACT Fibernet"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900"
                        />
                        <p className="text-xs text-gray-500 mt-1">Internet service provider</p>
                      </div>

                      {/* Monthly Amount - Already handled above */}
                      <div>
                        <p className="text-xs text-gray-500 text-center pt-8">Monthly amount configured above</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Expiry Date - Only for Other */}
                {formData.category === 'Other' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Expiry Date
                    </label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
                      <input
                        type="date"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Reminder cutoff date</p>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 3: Reminder Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                <h2 className="text-lg font-bold text-gray-900">Reminder Settings</h2>
              </div>

              {/* Remind Before */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Send Reminder Before Due Date
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Bell size={18} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
                    <input
                      type="number"
                      name="remindBefore"
                      value={formData.remindBefore}
                      onChange={handleChange}
                      className="w-24 pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                      min="0"
                      max="30"
                    />
                  </div>
                  <span className="text-gray-600 font-medium">days</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Get notified before payment due</p>
              </div>

              {/* WhatsApp Toggle */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  WhatsApp Reminders
                </label>
                <button
                  type="button"
                  onClick={handleWhatsAppToggle}
                  className={`flex items-center gap-3 w-full p-4 rounded-xl border-2 transition-all ${
                    enableWhatsApp
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    enableWhatsApp ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    {enableWhatsApp && <Check size={16} className="text-white" />}
                  </div>
                  <div className="text-left flex-1">
                    <p className={`font-semibold ${enableWhatsApp ? 'text-green-700' : 'text-gray-700'}`}>
                      {enableWhatsApp ? 'WhatsApp Enabled' : 'Enable WhatsApp Reminders'}
                    </p>
                    <p className="text-xs text-gray-500">Get payment reminders on WhatsApp</p>
                  </div>
                  <MessageCircle size={20} className={enableWhatsApp ? 'text-green-500' : 'text-gray-400'} />
                </button>
              </div>

              {/* WhatsApp Phone - Conditional */}
              {enableWhatsApp && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    WhatsApp Phone Number
                  </label>
                  <input
                    type="tel"
                    name="whatsappPhone"
                    value={formData.whatsappPhone}
                    onChange={handleChange}
                    placeholder="+91 9999 999 999"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                    required={enableWhatsApp}
                  />
                  <p className="text-xs text-gray-500 mt-2">Include country code (e.g., +91)</p>
                </div>
              )}
            </div>

            {/* SECTION 4: Payment Method */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                <h2 className="text-lg font-bold text-gray-900">Payment Method</h2>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  How do you pay?
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 bg-white"
                >
                  {paymentMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">Your preferred payment method</p>
              </div>
            </div>

            {/* SECTION 5: Additional Notes */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                <h2 className="text-lg font-bold text-gray-900">Additional Notes</h2>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Add any additional information..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 resize-none"
                  rows="4"
                />
                <p className="text-xs text-gray-500 mt-2">Optional - additional context or reminders</p>
              </div>
            </div>
          </form>

          {/* Live Preview Card - Right Section (1 col on desktop) */}
          {formData.name && (
            <div className="sticky top-24 bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Eye size={20} className="text-blue-600" />
                Live Preview
              </h3>

              {/* Preview Gradient Card */}
              <div className={`rounded-xl p-6 text-white space-y-4 ${
                formData.category === 'Loan' 
                  ? 'bg-gradient-to-br from-teal-500 to-teal-600'
                  : formData.category === 'Insurance'
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                  : formData.category === 'Internet'
                  ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                  : 'bg-gradient-to-br from-blue-500 to-blue-600'
              }`}>
                <div>
                  <p className={`${formData.category === 'Loan' ? 'text-teal-100' : formData.category === 'Insurance' ? 'text-orange-100' : formData.category === 'Internet' ? 'text-purple-100' : 'text-blue-100'} text-xs uppercase tracking-wider mb-1`}>
                    {formData.category}
                  </p>
                  <p className="text-xl font-bold">{formData.name || 'Service Name'}</p>
                </div>

                {/* Loan-Specific Preview */}
                {formData.category === 'Loan' && loanMetrics ? (
                  <>
                    <div className="border-t border-teal-400 pt-4 space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-teal-100 text-sm">Monthly EMI</span>
                        <span className="text-2xl font-bold">₹{loanMetrics.emiAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-teal-100 text-sm">Remaining</span>
                        <span className="text-lg font-semibold">₹{loanMetrics.totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-teal-100 text-sm">End Date</span>
                        <span className="font-semibold">{loanEndDate?.toLocaleDateString('en-IN', {month: 'short', year: 'numeric'})}</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="w-full bg-teal-400 rounded-full h-2"></div>
                      <p className="text-xs text-teal-100 mt-2">Loan Duration: {loanMetrics.tenureMonths} months</p>
                    </div>
                  </>
                ) : formData.category === 'Insurance' ? (
                  <>
                    <div className="border-t border-orange-400 pt-4 space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-orange-100 text-sm">Premium</span>
                        <span className="text-2xl font-bold">₹{Number(formData.amount || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-orange-100 text-sm">/ year</span>
                      </div>
                      {formData.expiryDate && (
                        <div className="flex justify-between items-baseline">
                          <span className="text-orange-100 text-sm">Expires</span>
                          <span className="font-semibold">{new Date(formData.expiryDate).toLocaleDateString('en-IN', {month: 'short', year: 'numeric'})}</span>
                        </div>
                      )}
                      {formData.coverageAmount && (
                        <div className="flex justify-between items-baseline">
                          <span className="text-orange-100 text-sm">Coverage</span>
                          <span className="font-semibold">₹{Number(formData.coverageAmount).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </div>
                    {formData.provider && (
                      <div className="mt-2 text-orange-100 text-xs">
                        Provider: {formData.provider}
                      </div>
                    )}
                  </>
                ) : formData.category === 'Internet' ? (
                  <>
                    <div className="border-t border-purple-400 pt-4 space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-purple-100 text-sm">Monthly Bill</span>
                        <span className="text-xl font-bold">₹{Number(formData.amount || 0).toLocaleString('en-IN')}</span>
                      </div>
                      {nextDueDate && (
                        <div className="flex justify-between items-baseline">
                          <span className="text-purple-100 text-sm">Next Bill</span>
                          <span className="font-semibold">{nextDueDate.toLocaleDateString('en-IN', {month: 'short', day: 'numeric'})}</span>
                        </div>
                      )}
                    </div>
                    {formData.provider && (
                      <div className="mt-2 text-purple-100 text-xs">
                        {formData.provider}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="border-t border-opacity-30 border-white pt-4 space-y-2">
                      <div className="flex items-baseline gap-1">
                        <p className="text-3xl font-bold">₹{formData.amount || '0'}</p>
                        <p className="text-blue-100 text-sm">
                          / {cycleLabel[formData.cycle] || 'month'}
                        </p>
                      </div>
                      {nextDueDate && (
                        <div className="pt-2 border-t border-opacity-30 border-white">
                          <p className="text-blue-100 text-xs">Next Due</p>
                          <p className="font-semibold">{nextDueDate.toLocaleDateString('en-IN', {month: 'short', day: 'numeric'})}</p>
                        </div>
                      )}
                    </div>
                    {formData.remindBefore && (
                      <div className="flex items-center gap-2">
                        <Bell size={16} />
                        <p className="text-sm">Remind {formData.remindBefore} days before</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Payment Method</p>
                <p className="font-semibold text-gray-900">
                  {paymentMethods.find(m => m.value === formData.paymentMethod)?.label}
                </p>
              </div>

              {/* WhatsApp Status */}
              {enableWhatsApp && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <MessageCircle size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-green-700">WhatsApp Enabled</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/subscriptions')}
            className="px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Check size={20} />
                {isEdit ? 'Update' : 'Add'} {formData.category}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEditSubscription;


