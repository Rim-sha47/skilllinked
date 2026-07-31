const getFileUrl = (req, specificFile = null) => {
  const fileToProcess = specificFile || req.file;
  if (!fileToProcess) return null;
  // If Cloudinary (or any other absolute URL), return as is
  if (fileToProcess.path && fileToProcess.path.startsWith('http')) {
    return fileToProcess.path;
  }
  // If local disk storage, construct the URL
  const hostUrl = req.protocol + '://' + req.get('host');
  return `${hostUrl}/uploads/${fileToProcess.filename}`;
};

module.exports = getFileUrl;

module.exports = getFileUrl;
