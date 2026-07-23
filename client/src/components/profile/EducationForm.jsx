import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../common/Button';

export const EducationForm = ({ defaultValues, onSubmit, isSubmitting }) => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({ defaultValues });
  const isCurrent = watch('current');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">
        {defaultValues?._id ? 'Edit Education' : 'Add Education'}
      </h2>
      
      <div>
        <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">School / University</label>
        <input 
          type="text" 
          {...register('school', { required: 'School is required' })} 
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-text-primary dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          placeholder="e.g. Stanford University"
        />
        {errors.school && <span className="text-red-500 text-xs mt-1">{errors.school.message}</span>}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">Degree</label>
        <input 
          type="text" 
          {...register('degree', { required: 'Degree is required' })} 
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-text-primary dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          placeholder="e.g. Bachelor of Science"
        />
        {errors.degree && <span className="text-red-500 text-xs mt-1">{errors.degree.message}</span>}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">Field of Study</label>
        <input 
          type="text" 
          {...register('fieldOfStudy', { required: 'Field of study is required' })} 
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-text-primary dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          placeholder="e.g. Computer Science"
        />
        {errors.fieldOfStudy && <span className="text-red-500 text-xs mt-1">{errors.fieldOfStudy.message}</span>}
      </div>

      <div className="flex items-center space-x-2 my-2">
        <input 
          type="checkbox" 
          id="currentEdu"
          {...register('current')} 
          className="rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="currentEdu" className="text-sm font-medium text-text-secondary dark:text-gray-300">I currently study here</label>
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
          placeholder="Activities and societies..."
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

export default EducationForm;
