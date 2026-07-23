import React, { useState } from 'react';
import { Button } from '../../components/common/Button';

export default function ProfilePicForm({ onSubmit, isSubmitting }) {
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    onSubmit(fd);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
        required
        className="w-full p-2 border rounded-lg"
      />
      <Button type="submit" disabled={isSubmitting} className="w-full shadow-glow">
        {isSubmitting ? 'Uploading...' : 'Upload'}
      </Button>
    </form>
  );
}
