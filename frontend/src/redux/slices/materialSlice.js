import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import materialService from '../../services/materialService';

const initialState = {
  materials: [],
  summary: null,
  loading: false,
  error: null,
};

// ─── Thunks ──────────────────────────────────────────────────────────────────

export const fetchMaterials = createAsyncThunk(
  'materials/fetchAll',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await materialService.getMaterials(filters);
      return response.data.purchases;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch material purchases.';
      return rejectWithValue(message);
    }
  }
);

export const createMaterial = createAsyncThunk(
  'materials/create',
  async (materialData, { rejectWithValue }) => {
    try {
      const response = await materialService.createMaterial(materialData);
      return response.data.purchase;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create material purchase.';
      return rejectWithValue(message);
    }
  }
);

export const updateMaterial = createAsyncThunk(
  'materials/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await materialService.updateMaterial(id, data);
      return response.data.purchase;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update material purchase.';
      return rejectWithValue(message);
    }
  }
);

export const deleteMaterial = createAsyncThunk(
  'materials/delete',
  async (id, { rejectWithValue }) => {
    try {
      await materialService.deleteMaterial(id);
      return id;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete material purchase.';
      return rejectWithValue(message);
    }
  }
);

export const fetchMaterialSummary = createAsyncThunk(
  'materials/fetchSummary',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await materialService.getMaterialSummary(projectId);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch material summary analytics.';
      return rejectWithValue(message);
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const materialSlice = createSlice({
  name: 'materials',
  initialState,
  reducers: {
    clearMaterials: (state) => {
      state.materials = [];
      state.summary = null;
    },
    clearMaterialError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Materials List
      .addCase(fetchMaterials.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMaterials.fulfilled, (state, action) => {
        state.loading = false;
        state.materials = action.payload;
      })
      .addCase(fetchMaterials.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Material
      .addCase(createMaterial.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMaterial.fulfilled, (state, action) => {
        state.loading = false;
        state.materials.unshift(action.payload);
      })
      .addCase(createMaterial.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Material
      .addCase(updateMaterial.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMaterial.fulfilled, (state, action) => {
        state.loading = false;
        state.materials = state.materials.map((m) =>
          m._id === action.payload._id ? action.payload : m
        );
      })
      .addCase(updateMaterial.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Material
      .addCase(deleteMaterial.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMaterial.fulfilled, (state, action) => {
        state.loading = false;
        state.materials = state.materials.filter((m) => m._id !== action.payload);
      })
      .addCase(deleteMaterial.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Material Summary Analytics
      .addCase(fetchMaterialSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMaterialSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchMaterialSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearMaterials, clearMaterialError } = materialSlice.actions;

export default materialSlice.reducer;
