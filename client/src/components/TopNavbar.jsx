import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { Menu, X, BarChart3 } from 'lucide-react';

const TopNavbar = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinkClass = ({ isActive }) =>
    `px-4 py-2.5 rounded-lg font-medium transition-all ${
      isActive
        ? 'bg-blue-600 text-white shadow-lg'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`;

  const handleLogoClick = () => {
    navigate('/dashboard');
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div
              onClick={handleLogoClick}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="p-2 bg-blue-600 rounded-lg transition-shadow">
                <BarChart3 size={24} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900">Bill Reminder</span>
                <span className="text-xs text-gray-500">Subscription Manager</span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-2">
              <NavLink to="/dashboard" className={navLinkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/subscriptions" className={navLinkClass}>
                Subscriptions
              </NavLink>
              <NavLink to="/subscriptions/add" className={navLinkClass}>
                Add Subscription
              </NavLink>
              <NavLink to="/payments" className={navLinkClass}>
                Payment History
              </NavLink>
            </div>

            {/* User Menu */}
            <div className="hidden md:block">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: 'w-10 h-10',
                  },
                }}
                afterSignOutUrl="/"
              />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? (
                <X size={24} className="text-gray-700" />
              ) : (
                <Menu size={24} className="text-gray-700" />
              )}
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 space-y-2 border-t border-gray-100 pt-4">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `block px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/subscriptions"
                className={({ isActive }) =>
                  `block px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                Subscriptions
              </NavLink>
              <NavLink
                to="/subscriptions/add"
                className={({ isActive }) =>
                  `block px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                Add Subscription
              </NavLink>
              <NavLink
                to="/payments"
                className={({ isActive }) =>
                  `block px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                Payment History
              </NavLink>
              <div className="px-4 py-2 border-t border-gray-100 mt-2">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: 'w-10 h-10',
                    },
                  }}
                  afterSignOutUrl="/"
                />
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default TopNavbar;
