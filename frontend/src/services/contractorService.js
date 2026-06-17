import api from './api';

const contractorService = {
  // Fetch contractors with optional filters (projectId, workType, status)
  getContractors: async (filters = {}) => {
    const response = await api.get('/contractors', { params: filters });
    return response.data;
  },

  // Fetch single contractor by ID
  getContractorById: async (id) => {
    const response = await api.get(`/contractors/${id}`);
    return response.data;
  },

  // Create a new contractor
  createContractor: async (data) => {
    const response = await api.post('/contractors', data);
    return response.data;
  },

  // Update contractor details
  updateContractor: async (id, data) => {
    const response = await api.put(`/contractors/${id}`, data);
    return response.data;
  },

  // Soft-delete contractor
  deleteContractor: async (id) => {
    const response = await api.delete(`/contractors/${id}`);
    return response.data;
  },

  // Record a new payment for a contractor
  recordPayment: async (contractorId, paymentData) => {
    const response = await api.post(`/contractors/${contractorId}/payments`, paymentData);
    return response.data;
  },

  // Delete a specific payment from a contractor
  deletePayment: async (contractorId, paymentId) => {
    const response = await api.delete(`/contractors/${contractorId}/payments/${paymentId}`);
    return response.data;
  },

  // Get contractor summary stats for a project
  getContractorSummary: async (projectId) => {
    const response = await api.get(`/contractors/summary/${projectId}`);
    return response.data;
  },
};

export default contractorService;
