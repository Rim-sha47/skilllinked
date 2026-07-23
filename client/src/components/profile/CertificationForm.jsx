import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../common/Button';

export const CertificationForm = ({ defaultValues, onSubmit, isSubmitting }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">
        {defaultValues?._id ? 'Edit Certification' : 'Add Certification'}
      </h2>
      
      <div>
        <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">Name</label>
        <input 
          type="text" 
          {...register('name', { required: 'Name is required' })} 
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-text-primary dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          placeholder="e.g. AWS Certified Solutions Architect"
        />
        {errors.name && <span className="text-red-500 text-xs mt-1">{errors.name.message}</span>}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">Issuing Organization</label>
        <input 
          type="text" 
          {...register('issuingOrganization', { required: 'Issuing organization is required' })} 
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-text-primary dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          placeholder="e.g. Amazon Web Services (AWS)"
        />
        {errors.issuingOrganization && <span className="text-red-500 text-xs mt-1">{errors.issuingOrganization.message}</span>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">Issue Date</label>
          <input 
            type="date" 
            {...register('issueDate', { required: 'Issue date is required' })} 
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-text-primary dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          />
          {errors.issueDate && <span className="text-red-500 text-xs mt-1">{errors.issueDate.message}</span>}
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">Expiration Date (Optional)</label>
          <input 
            type="date" 
            {...register('expirationDate')} 
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-text-primary dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">Credential ID (Optional)</label>
        <input 
          type="text" 
          {...register('credentialId')} 
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-text-primary dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          placeholder="e.g. ABC123DEF456"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">Credential URL (Optional)</label>
        <input 
          type="url" 
          {...register('credentialUrl')} 
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-text-primary dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          placeholder="https://..."
        />
      </div>

      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto shadow-glow">
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

export default CertificationForm;
