/**
 * Loan Card Component
 * Displays loan information with EMI tracking and progress bar
 * Shows: EMI amount, remaining balance, next EMI date, progress percentage
 */

import React from 'react';
import { TrendingDown, Calendar, DollarSign, CheckCircle } from 'lucide-react';

const LoanCard = ({ loan, onPayEMI }) => {
  // Calculate progress percentage
  const progress = loan.totalAmount > 0 
    ? Math.round(((loan.totalAmount - loan.remainingAmount) / loan.totalAmount) * 100)
    : 0;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Check if loan is overdue
  const isOverdue = new Date(loan.nextDueDate) < new Date();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-6 bg-teal-500 rounded-full"></div>
            <h3 className="text-lg font-bold text-gray-900">{loan.name}</h3>
            {loan.status === 'Completed' && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-lg ml-auto">
                <CheckCircle size={14} className="text-green-600" />
                <span className="text-xs font-semibold text-green-700">Paid</span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {loan.tenureMonths} month loan • {Math.round(loan.tenureMonths / 12)} year duration
          </p>
        </div>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* EMI Amount */}
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 border border-teal-200">
          <p className="text-xs text-teal-600 uppercase tracking-wide mb-2">Monthly EMI</p>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-bold text-teal-900">₹{loan.emiAmount.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Remaining Balance */}
        <div className={`rounded-xl p-4 border ${
          loan.remainingAmount > 0
            ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
            : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
        }`}>
          <p className={`text-xs uppercase tracking-wide mb-2 ${
            loan.remainingAmount > 0 ? 'text-orange-600' : 'text-green-600'
          }`}>
            Remaining Balance
          </p>
          <div className="flex items-baseline gap-1">
            <p className={`text-2xl font-bold ${
              loan.remainingAmount > 0 ? 'text-orange-900' : 'text-green-900'
            }`}>
              ₹{loan.remainingAmount.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Next EMI Due */}
        <div className={`rounded-xl p-4 border ${
          isOverdue 
            ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
            : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
        }`}>
          <p className={`text-xs uppercase tracking-wide mb-2 ${
            isOverdue ? 'text-red-600' : 'text-blue-600'
          }`}>
            Next EMI Due
          </p>
          <p className={`font-bold ${isOverdue ? 'text-red-900' : 'text-blue-900'}`}>
            {formatDate(loan.nextDueDate)}
          </p>
          {isOverdue && (
            <p className="text-xs text-red-600 font-semibold mt-1">Overdue!</p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-700">Progress</p>
          <p className="text-sm font-bold text-teal-600">{progress}%</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-teal-500 to-teal-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{loan.paidCount || 0} payments made</span>
          <span>{Math.max(0, Math.ceil(loan.remainingAmount / loan.emiAmount))} EMIs remaining</span>
        </div>
      </div>

      {/* Loan Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Loan Amount</p>
          <p className="font-bold text-gray-900">{formatCurrency(loan.totalAmount)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Paid</p>
          <p className="font-bold text-teal-600">
            {formatCurrency(loan.totalAmount - loan.remainingAmount)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Loan Started</p>
          <p className="font-bold text-gray-900">{formatDate(loan.startDate)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Loan Ends</p>
          <p className="font-bold text-gray-900">{formatDate(loan.endDate)}</p>
        </div>
      </div>

      {/* Action Button */}
      {loan.status === 'Active' && (
        <button
          onClick={() => onPayEMI(loan._id)}
          className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <DollarSign size={18} />
          Pay This Month's EMI
        </button>
      )}

      {loan.status === 'Completed' && (
        <div className="w-full py-3 px-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center gap-2">
          <CheckCircle size={18} className="text-green-600" />
          <span className="font-semibold text-green-700">Loan Fully Paid</span>
        </div>
      )}
    </div>
  );
};

export default LoanCard;
