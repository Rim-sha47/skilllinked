import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../common/Button';

export const BasicInfoForm = ({ defaultValues, onSubmit, isSubmitting }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">Edit Profile Info</h2>
      
      <div>
        <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">Headline</label>
        <input 
          type="text" 
          {...register('headline', { required: 'Headline is required' })} 
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-text-primary dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          placeholder="e.g. Senior React Developer"
        />
        {errors.headline && <span className="text-red-500 text-xs mt-1">{errors.headline.message}</span>}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">Location</label>
        <input 
          type="text" 
          {...register('location')} 
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-text-primary dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          placeholder="e.g. San Francisco, CA"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">Website URL</label>
        <input 
          type="url" 
          {...register('website')} 
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-text-primary dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          placeholder="https://yourportfolio.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">About (Bio)</label>
        <textarea 
          {...register('bio')} 
          rows="4"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-text-primary dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-none"
          placeholder="Write something about yourself..."
        ></textarea>
      </div>

      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto shadow-glow">
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

export default BasicInfoForm;
