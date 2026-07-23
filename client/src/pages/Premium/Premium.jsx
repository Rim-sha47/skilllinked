import React from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { FaCheck, FaCrown } from 'react-icons/fa';

const Premium = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-10 py-8">
      <div className="text-center space-y-4">
        <FaCrown className="mx-auto text-5xl text-accent" />
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
          Accelerate your career with <span className="text-primary">Premium</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Stand out to recruiters, gain exclusive AI insights, and grow your professional network faster.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Tier */}
        <Card className="flex flex-col p-8 border-2 border-transparent">
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
          <Button variant="outline" className="w-full mt-8 rounded-lg py-3 font-semibold">Current Plan</Button>
        </Card>

        {/* Premium Tier */}
        <Card className="flex flex-col p-8 border-2 border-primary relative transform md:-translate-y-4 shadow-2xl dark:shadow-primary/20">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-accent text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wide">
            Recommended
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
                <FaCheck className="text-primary mt-1 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">{feature}</span>
              </li>
            ))}
          </ul>
          <Button variant="primary" className="w-full mt-8 rounded-lg py-3 font-semibold shadow-lg shadow-primary/30">Upgrade Now</Button>
        </Card>
      </div>
    </div>
  );
};

export default Premium;
