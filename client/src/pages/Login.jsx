/**
 * Login Page
 * User authentication - email and password login
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { authAPI } from '../services/api';

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData.email, formData.password);
      
      if (response.data.token && response.data.user) {
        // Store token and user in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Set token in axios headers IMMEDIATELY
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        console.log('[LOGIN] Token set in axios headers');
        console.log('[LOGIN] Token:', response.data.token.substring(0, 30) + '...');
        
        // Call the callback to update parent component
        if (onLoginSuccess) {
          onLoginSuccess(response.data.user);
        }
        
        // Navigate to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Bill Reminder</h1>
        <p className="text-gray-600 mb-6">Manage your subscriptions & bills</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition mb-4 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Demo Credentials Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-800 mb-3">Test Accounts:</h3>
          
          <div className="mb-3 pb-3 border-b border-blue-200">
            <p className="text-sm text-gray-700 font-medium text-blue-600">Demo Account:</p>
            <p className="text-sm text-gray-700 ml-2">
              📧 <span className="font-mono">demo@example.com</span>
            </p>
            <p className="text-sm text-gray-700 ml-2">
              🔑 <span className="font-mono">password</span>
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-700 font-medium text-blue-600">Tester Account:</p>
            <p className="text-sm text-gray-700 ml-2">
              📧 <span className="font-mono">tester@example.com</span>
            </p>
            <p className="text-sm text-gray-700 ml-2">
              🔑 <span className="font-mono">tester123</span>
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
