import api from './api';

const materialService = {
  // Fetch materials with filters (projectId, materialType, startDate, endDate)
  getMaterials: async (filters = {}) => {
    const response = await api.get('/materials', { params: filters });
    return response.data;
  },

  // Fetch single material log by ID
  getMaterialById: async (id) => {
    const response = await api.get(`/materials/${id}`);
    return response.data;
  },

  // Record a new material purchase
  createMaterial: async (materialData) => {
    const response = await api.post('/materials', materialData);
    return response.data;
  },

  // Update existing material purchase record
  updateMaterial: async (id, materialData) => {
    const response = await api.put(`/materials/${id}`, materialData);
    return response.data;
  },

  // Soft-delete material purchase record
  deleteMaterial: async (id) => {
    const response = await api.delete(`/materials/${id}`);
    return response.data;
  },

  // Fetch materials analytical summary for a project
  getMaterialSummary: async (projectId) => {
    const response = await api.get(`/materials/summary/${projectId}`);
    return response.data;
  },
};

export default materialService;
