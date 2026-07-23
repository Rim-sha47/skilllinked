import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../common/Button';

export const SkillForm = ({ onSubmit, isSubmitting }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const handleFormSubmit = async (data) => {
    await onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">Add Skill</h2>
      
      <div>
        <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">Skill Name</label>
        <input 
          type="text" 
          {...register('name', { required: 'Skill name is required' })} 
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-text-primary dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          placeholder="e.g. React.js, Python, Project Management"
        />
        {errors.name && <span className="text-red-500 text-xs mt-1">{errors.name.message}</span>}
      </div>

      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto shadow-glow">
          {isSubmitting ? 'Adding...' : 'Add Skill'}
        </Button>
      </div>
    </form>
  );
};

export default SkillForm;
