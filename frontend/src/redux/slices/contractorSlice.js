import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import contractorService from '../../services/contractorService';

const initialState = {
  contractors: [],
  currentContractor: null,
  summary: null,
  loading: false,
  paymentLoading: false,
  error: null,
};

// ─── Thunks ──────────────────────────────────────────────────────────────────

export const fetchContractors = createAsyncThunk(
  'contractors/fetchAll',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await contractorService.getContractors(filters);
      return response.data.contractors;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch contractors.');
    }
  }
);

export const fetchContractorById = createAsyncThunk(
  'contractors/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await contractorService.getContractorById(id);
      return response.data.contractor;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch contractor.');
    }
  }
);

export const createContractor = createAsyncThunk(
  'contractors/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await contractorService.createContractor(data);
      return response.data.contractor;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create contractor.');
    }
  }
);

export const updateContractor = createAsyncThunk(
  'contractors/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await contractorService.updateContractor(id, data);
      return response.data.contractor;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update contractor.');
    }
  }
);

export const deleteContractor = createAsyncThunk(
  'contractors/delete',
  async (id, { rejectWithValue }) => {
    try {
      await contractorService.deleteContractor(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete contractor.');
    }
  }
);

export const recordPayment = createAsyncThunk(
  'contractors/recordPayment',
  async ({ contractorId, paymentData }, { rejectWithValue }) => {
    try {
      const response = await contractorService.recordPayment(contractorId, paymentData);
      return response.data.contractor;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to record payment.');
    }
  }
);

export const deletePayment = createAsyncThunk(
  'contractors/deletePayment',
  async ({ contractorId, paymentId }, { rejectWithValue }) => {
    try {
      await contractorService.deletePayment(contractorId, paymentId);
      return { contractorId, paymentId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete payment.');
    }
  }
);

export const fetchContractorSummary = createAsyncThunk(
  'contractors/fetchSummary',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await contractorService.getContractorSummary(projectId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch summary.');
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const contractorSlice = createSlice({
  name: 'contractors',
  initialState,
  reducers: {
    clearContractors: (state) => {
      state.contractors = [];
      state.summary = null;
    },
    clearCurrentContractor: (state) => {
      state.currentContractor = null;
    },
    clearContractorError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchContractors.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchContractors.fulfilled, (state, action) => { state.loading = false; state.contractors = action.payload; })
      .addCase(fetchContractors.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // Fetch By ID
      .addCase(fetchContractorById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchContractorById.fulfilled, (state, action) => { state.loading = false; state.currentContractor = action.payload; })
      .addCase(fetchContractorById.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // Create
      .addCase(createContractor.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createContractor.fulfilled, (state, action) => { state.loading = false; state.contractors.unshift(action.payload); })
      .addCase(createContractor.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // Update
      .addCase(updateContractor.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateContractor.fulfilled, (state, action) => {
        state.loading = false;
        state.contractors = state.contractors.map((c) => c._id === action.payload._id ? action.payload : c);
        if (state.currentContractor?._id === action.payload._id) state.currentContractor = action.payload;
      })
      .addCase(updateContractor.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // Delete
      .addCase(deleteContractor.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteContractor.fulfilled, (state, action) => {
        state.loading = false;
        state.contractors = state.contractors.filter((c) => c._id !== action.payload);
      })
      .addCase(deleteContractor.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // Record Payment
      .addCase(recordPayment.pending, (state) => { state.paymentLoading = true; state.error = null; })
      .addCase(recordPayment.fulfilled, (state, action) => {
        state.paymentLoading = false;
        state.contractors = state.contractors.map((c) => c._id === action.payload._id ? action.payload : c);
        if (state.currentContractor?._id === action.payload._id) state.currentContractor = action.payload;
      })
      .addCase(recordPayment.rejected, (state, action) => { state.paymentLoading = false; state.error = action.payload; })

      // Delete Payment
      .addCase(deletePayment.pending, (state) => { state.paymentLoading = true; state.error = null; })
      .addCase(deletePayment.fulfilled, (state, action) => {
        state.paymentLoading = false;
        // Update is done by refetching in the component
      })
      .addCase(deletePayment.rejected, (state, action) => { state.paymentLoading = false; state.error = action.payload; })

      // Fetch Summary
      .addCase(fetchContractorSummary.pending, (state) => { state.loading = true; })
      .addCase(fetchContractorSummary.fulfilled, (state, action) => { state.loading = false; state.summary = action.payload; })
      .addCase(fetchContractorSummary.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { clearContractors, clearCurrentContractor, clearContractorError } = contractorSlice.actions;

export default contractorSlice.reducer;
