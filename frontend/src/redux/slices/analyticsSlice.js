import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import analyticsService from '../../services/analyticsService';

const initialState = {
  overview: null,
  budgetData: [],
  materialData: null,
  contractorData: null,
  monthlyData: [],
  alerts: [],
  loading: {
    overview: false,
    budget: false,
    material: false,
    contractor: false,
    monthly: false,
    alerts: false,
  },
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchOverview = createAsyncThunk(
  'analytics/fetchOverview',
  async (_, { rejectWithValue }) => {
    try {
      const res = await analyticsService.getOverview();
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to load overview.');
    }
  }
);

export const fetchBudgetOverview = createAsyncThunk(
  'analytics/fetchBudgetOverview',
  async (_, { rejectWithValue }) => {
    try {
      const res = await analyticsService.getBudgetOverview();
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to load budget data.');
    }
  }
);

export const fetchMaterialBreakdown = createAsyncThunk(
  'analytics/fetchMaterialBreakdown',
  async (_, { rejectWithValue }) => {
    try {
      const res = await analyticsService.getMaterialBreakdown();
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to load material data.');
    }
  }
);

export const fetchContractorSummary = createAsyncThunk(
  'analytics/fetchContractorSummary',
  async (_, { rejectWithValue }) => {
    try {
      const res = await analyticsService.getContractorSummary();
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to load contractor data.');
    }
  }
);

export const fetchMonthlySpending = createAsyncThunk(
  'analytics/fetchMonthlySpending',
  async (year, { rejectWithValue }) => {
    try {
      const res = await analyticsService.getMonthlySpending(year);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to load monthly data.');
    }
  }
);

export const fetchBudgetAlerts = createAsyncThunk(
  'analytics/fetchBudgetAlerts',
  async (_, { rejectWithValue }) => {
    try {
      const res = await analyticsService.getBudgetAlerts();
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to load budget alerts.');
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearAnalytics: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Overview
      .addCase(fetchOverview.pending, (s) => { s.loading.overview = true; s.error = null; })
      .addCase(fetchOverview.fulfilled, (s, a) => { s.loading.overview = false; s.overview = a.payload; })
      .addCase(fetchOverview.rejected, (s, a) => { s.loading.overview = false; s.error = a.payload; })

      // Budget Overview
      .addCase(fetchBudgetOverview.pending, (s) => { s.loading.budget = true; })
      .addCase(fetchBudgetOverview.fulfilled, (s, a) => { s.loading.budget = false; s.budgetData = a.payload; })
      .addCase(fetchBudgetOverview.rejected, (s, a) => { s.loading.budget = false; s.error = a.payload; })

      // Material Breakdown
      .addCase(fetchMaterialBreakdown.pending, (s) => { s.loading.material = true; })
      .addCase(fetchMaterialBreakdown.fulfilled, (s, a) => { s.loading.material = false; s.materialData = a.payload; })
      .addCase(fetchMaterialBreakdown.rejected, (s, a) => { s.loading.material = false; s.error = a.payload; })

      // Contractor Summary
      .addCase(fetchContractorSummary.pending, (s) => { s.loading.contractor = true; })
      .addCase(fetchContractorSummary.fulfilled, (s, a) => { s.loading.contractor = false; s.contractorData = a.payload; })
      .addCase(fetchContractorSummary.rejected, (s, a) => { s.loading.contractor = false; s.error = a.payload; })

      // Monthly Spending
      .addCase(fetchMonthlySpending.pending, (s) => { s.loading.monthly = true; })
      .addCase(fetchMonthlySpending.fulfilled, (s, a) => { s.loading.monthly = false; s.monthlyData = a.payload; })
      .addCase(fetchMonthlySpending.rejected, (s, a) => { s.loading.monthly = false; s.error = a.payload; })

      // Budget Alerts
      .addCase(fetchBudgetAlerts.pending, (s) => { s.loading.alerts = true; })
      .addCase(fetchBudgetAlerts.fulfilled, (s, a) => { s.loading.alerts = false; s.alerts = a.payload; })
      .addCase(fetchBudgetAlerts.rejected, (s, a) => { s.loading.alerts = false; s.error = a.payload; });
  },
});

export const { clearAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer;
