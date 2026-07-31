import React, { useState, useRef } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '../../components/common/Button';
import { getCroppedImg } from '../../utils/cropImage';

export default function CoverPhotoForm({ onSubmit, isSubmitting }) {
  const [upImg, setUpImg] = useState();
  const imgRef = useRef(null);
  const [crop, setCrop] = useState({ unit: '%', width: 100, aspect: 4 / 1 });
  const [completedCrop, setCompletedCrop] = useState(null);

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setUpImg(reader.result));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onLoad = (e) => {
    imgRef.current = e.currentTarget;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!completedCrop || !imgRef.current) return;
    
    try {
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop, 'cover.jpg');
      const fd = new FormData();
      fd.append('file', croppedBlob, 'cover.jpg');
      onSubmit(fd);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="file"
        accept="image/*"
        onChange={onSelectFile}
        required
        className="w-full p-2 border rounded-lg dark:border-gray-700 dark:bg-dark-card dark:text-gray-200"
      />
      {upImg && (
        <div className="flex justify-center my-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-2 overflow-hidden max-h-80">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={4 / 1}
          >
            <img src={upImg} onLoad={onLoad} alt="Upload Preview" style={{ maxHeight: '300px' }} />
          </ReactCrop>
        </div>
      )}
      <Button type="submit" disabled={isSubmitting || !completedCrop} className="w-full shadow-glow">
        {isSubmitting ? 'Uploading...' : 'Upload & Save'}
      </Button>
    </form>
  );
}
