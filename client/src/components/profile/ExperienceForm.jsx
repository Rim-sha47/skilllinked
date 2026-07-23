import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../common/Button';

export const ExperienceForm = ({ defaultValues, onSubmit, isSubmitting }) => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({ defaultValues });
  const isCurrent = watch('current');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">
        {defaultValues?._id ? 'Edit Experience' : 'Add Experience'}
      </h2>
      
      <div>
        <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">Title / Role</label>
        <input 
          type="text" 
          {...register('title', { required: 'Title is required' })} 
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-text-primary dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          placeholder="e.g. Frontend Developer"
        />
        {errors.title && <span className="text-red-500 text-xs mt-1">{errors.title.message}</span>}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">Company</label>
        <input 
          type="text" 
          {...register('company', { required: 'Company is required' })} 
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-text-primary dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          placeholder="e.g. Google"
        />
        {errors.company && <span className="text-red-500 text-xs mt-1">{errors.company.message}</span>}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">Location</label>
        <input 
          type="text" 
          {...register('location')} 
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-text-primary dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          placeholder="e.g. Mountain View, CA"
        />
      </div>

      <div className="flex items-center space-x-2 my-2">
        <input 
          type="checkbox" 
          id="current"
          {...register('current')} 
          className="rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="current" className="text-sm font-medium text-text-secondary dark:text-gray-300">I currently work here</label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">Start Date</label>
          <input 
            type="date" 
            {...register('from', { required: 'Start date is required' })} 
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-text-primary dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          />
          {errors.from && <span className="text-red-500 text-xs mt-1">{errors.from.message}</span>}
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">End Date</label>
          <input 
            type="date" 
            {...register('to', { required: !isCurrent ? 'End date is required' : false })} 
            disabled={isCurrent}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-text-primary dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors disabled:opacity-50"
          />
          {errors.to && <span className="text-red-500 text-xs mt-1">{errors.to.message}</span>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">Description</label>
        <textarea 
          {...register('description')} 
          rows="3"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-text-primary dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-none"
          placeholder="Describe your responsibilities and achievements..."
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

export default ExperienceForm;
