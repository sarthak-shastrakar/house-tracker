import api from './api';

const projectService = {
  // Get all projects for current owner
  getProjects: async (filters = {}) => {
    const response = await api.get('/projects', { params: filters });
    return response.data;
  },

  // Get project by ID
  getProjectById: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  // Create new project
  createProject: async (projectData) => {
    const response = await api.post('/projects', projectData);
    return response.data;
  },

  // Update existing project details
  updateProject: async (id, projectData) => {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  },

  // Soft delete a project
  deleteProject: async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  // Get project stats
  getProjectStats: async (id) => {
    const response = await api.get(`/projects/${id}/stats`);
    return response.data;
  },

  // ─── Dashboard Stats Calls ────────────────────────────────────────────────
  getDashboardStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getDashboardBudgetOverview: async () => {
    const response = await api.get('/dashboard/budget-overview');
    return response.data;
  },

  getDashboardRecentActivity: async () => {
    const response = await api.get('/dashboard/recent-activity');
    return response.data;
  },
};

export default projectService;
