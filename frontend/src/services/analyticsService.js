import api from './api';

const analyticsService = {
  getOverview: async () => {
    const res = await api.get('/analytics/overview');
    return res.data;
  },

  getBudgetOverview: async () => {
    const res = await api.get('/analytics/budget-overview');
    return res.data;
  },

  getMaterialBreakdown: async () => {
    const res = await api.get('/analytics/material-breakdown');
    return res.data;
  },

  getContractorSummary: async () => {
    const res = await api.get('/analytics/contractor-summary');
    return res.data;
  },

  getMonthlySpending: async (year) => {
    const res = await api.get('/analytics/monthly-spending', { params: { year } });
    return res.data;
  },

  getBudgetAlerts: async () => {
    const res = await api.get('/analytics/budget-alerts');
    return res.data;
  },
};

export default analyticsService;
