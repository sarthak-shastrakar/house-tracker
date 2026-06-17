import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import billService from '../../services/billService';

const initialState = {
  bills: [],
  summary: null,
  loading: false,
  uploading: false,
  uploadProgress: 0,
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchBills = createAsyncThunk(
  'bills/fetchAll',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await billService.getBills(filters);
      return response.data.bills;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bills.');
    }
  }
);

export const uploadBill = createAsyncThunk(
  'bills/upload',
  async ({ formData, onProgress }, { rejectWithValue }) => {
    try {
      const response = await billService.uploadBill(formData, (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(pct);
        }
      });
      return response.data.bill;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload bill.');
    }
  }
);

export const updateBill = createAsyncThunk(
  'bills/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await billService.updateBill(id, data);
      return response.data.bill;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update bill.');
    }
  }
);

export const deleteBill = createAsyncThunk(
  'bills/delete',
  async (id, { rejectWithValue }) => {
    try {
      await billService.deleteBill(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete bill.');
    }
  }
);

export const fetchBillSummary = createAsyncThunk(
  'bills/fetchSummary',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await billService.getBillSummary(projectId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bill summary.');
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const billSlice = createSlice({
  name: 'bills',
  initialState,
  reducers: {
    clearBills: (state) => {
      state.bills = [];
      state.summary = null;
    },
    clearBillError: (state) => {
      state.error = null;
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchBills.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchBills.fulfilled, (state, action) => { state.loading = false; state.bills = action.payload; })
      .addCase(fetchBills.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // Upload
      .addCase(uploadBill.pending, (state) => { state.uploading = true; state.uploadProgress = 0; state.error = null; })
      .addCase(uploadBill.fulfilled, (state, action) => {
        state.uploading = false;
        state.uploadProgress = 100;
        state.bills.unshift(action.payload);
      })
      .addCase(uploadBill.rejected, (state, action) => { state.uploading = false; state.uploadProgress = 0; state.error = action.payload; })

      // Update
      .addCase(updateBill.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateBill.fulfilled, (state, action) => {
        state.loading = false;
        state.bills = state.bills.map((b) => b._id === action.payload._id ? action.payload : b);
      })
      .addCase(updateBill.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // Delete
      .addCase(deleteBill.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteBill.fulfilled, (state, action) => {
        state.loading = false;
        state.bills = state.bills.filter((b) => b._id !== action.payload);
      })
      .addCase(deleteBill.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // Summary
      .addCase(fetchBillSummary.pending, (state) => { state.loading = true; })
      .addCase(fetchBillSummary.fulfilled, (state, action) => { state.loading = false; state.summary = action.payload; })
      .addCase(fetchBillSummary.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { clearBills, clearBillError, setUploadProgress } = billSlice.actions;

export default billSlice.reducer;
