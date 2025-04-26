import api from './apiService';

export function uploadPhoto(logId, formData) {
  return api.post(`/uploads/${logId}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

export function uploadDocument(logId, formData) {
  return api.post(`/uploads/${logId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

export const uploadCertificate = (logId, formData) => {
  return api.post(`/logs/${logId}/certificate`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};


export function deleteFile(logId, fileType, fileId) {
  return api.delete(`/uploads/${logId}/${fileType}/${fileId}`);
}


export function getFilePreviewUrl(filePath) {
  if (filePath.startsWith('http')) return filePath;
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  return `${baseUrl}${filePath}`;
}
