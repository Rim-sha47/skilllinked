import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { FaCheck, FaCrown, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { updateUser } from '../../redux/slices/authSlice';

const Premium = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const res = await api.put('/auth/upgrade');
      const data = res?.data || res;
      dispatch(updateUser({ isPremium: true }));
      toast.success(data.message || 'Upgraded to Premium successfully! 🎉');
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Upgrade failed. Please try again.';
      toast.error(msg);
    } finally {
      setIsUpgrading(false);
    }
  };

  const isPremium = user?.isPremium;

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-8 px-4 sm:px-6">
      <div className="text-center space-y-4">
        <FaCrown className="mx-auto text-5xl text-accent" />
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
          {isPremium ? (
            <>Welcome back, <span className="text-primary">Premium</span> member!</>
          ) : (
            <>Accelerate your career with <span className="text-primary">Premium</span></>
          )}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {isPremium
            ? 'You have access to all Premium features. Enjoy your enhanced career experience.'
            : 'Stand out to recruiters, gain exclusive AI insights, and grow your professional network faster.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Tier */}
        <Card className={`flex flex-col p-8 border-2 ${isPremium ? 'border-transparent opacity-60' : 'border-transparent'}`}>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Basic</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Free forever</p>
            <div className="mt-4 text-4xl font-extrabold text-gray-900 dark:text-white">$0<span className="text-lg font-medium text-gray-500">/mo</span></div>
          </div>
          <ul className="space-y-4 flex-1">
            {['Build a professional profile', 'Find and connect with peers', 'Search and apply for jobs', 'Basic feed and messaging'].map((feature, i) => (
              <li key={i} className="flex items-start">
                <FaCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>
          <Button variant="outline" disabled className="w-full sm:w-auto mx-auto sm:mx-0 mt-8 rounded-lg py-3 px-6 font-semibold">
            {isPremium ? 'Basic Plan' : 'Current Plan'}
          </Button>
        </Card>

        {/* Premium Tier */}
        <Card className={`flex flex-col p-8 border-2 relative transform md:-translate-y-4 shadow-2xl dark:shadow-primary/20 ${isPremium ? 'border-green-500' : 'border-primary'}`}>
          <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wide ${isPremium ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-primary to-accent'}`}>
            {isPremium ? '✓ Active' : 'Recommended'}
          </div>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center">Premium <FaCrown className="ml-2 text-accent" /></h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">For serious professionals</p>
            <div className="mt-4 text-4xl font-extrabold text-gray-900 dark:text-white">$29<span className="text-lg font-medium text-gray-500">/mo</span></div>
          </div>
          <ul className="space-y-4 flex-1">
            {[
              'Everything in Basic',
              'See who viewed your profile',
              'Unlimited AI Resume Analysis',
              'Direct messaging to recruiters (InMail)',
              'Priority job applications',
              'Premium badge on profile'
            ].map((feature, i) => (
              <li key={i} className="flex items-start">
                <FaCheck className={`mt-1 mr-3 flex-shrink-0 ${isPremium ? 'text-green-500' : 'text-primary'}`} />
                <span className="text-gray-700 dark:text-gray-300 font-medium">{feature}</span>
              </li>
            ))}
          </ul>

          {isPremium ? (
            <Button variant="primary" disabled className="w-full sm:w-auto mx-auto sm:mx-0 mt-8 rounded-lg py-3 px-6 font-semibold shadow-lg shadow-green-500/30 bg-green-600 hover:bg-green-600 cursor-default flex items-center justify-center gap-2">
              <FaCrown /> You are a Premium Member
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="w-full sm:w-auto mx-auto sm:mx-0 mt-8 rounded-lg py-3 px-6 font-semibold shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
            >
              {isUpgrading ? (
                <><FaSpinner className="animate-spin" /> Upgrading...</>
              ) : (
                'Upgrade Now'
              )}
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Premium;
