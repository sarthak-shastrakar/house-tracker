import api from './api';

const billService = {
  // Fetch bills with optional filters (projectId, billType, startDate, endDate)
  getBills: async (filters = {}) => {
    const response = await api.get('/bills', { params: filters });
    return response.data;
  },

  // Get single bill
  getBillById: async (id) => {
    const response = await api.get(`/bills/${id}`);
    return response.data;
  },

  // Upload bill — multipart/form-data with file + metadata
  uploadBill: async (formData, onUploadProgress) => {
    const response = await api.post('/bills/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return response.data;
  },

  // Update bill metadata only (no file change)
  updateBill: async (id, data) => {
    const response = await api.put(`/bills/${id}`, data);
    return response.data;
  },

  // Soft-delete bill
  deleteBill: async (id) => {
    const response = await api.delete(`/bills/${id}`);
    return response.data;
  },

  // Get bill summary for a project
  getBillSummary: async (projectId) => {
    const response = await api.get(`/bills/summary/${projectId}`);
    return response.data;
  },
};

export default billService;
