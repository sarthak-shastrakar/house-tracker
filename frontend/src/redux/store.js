import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import projectsReducer from './slices/projectSlice';
import materialsReducer from './slices/materialSlice';
import contractorsReducer from './slices/contractorSlice';
import billsReducer from './slices/billSlice';
import analyticsReducer from './slices/analyticsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectsReducer,
    materials: materialsReducer,
    contractors: contractorsReducer,
    bills: billsReducer,
    analytics: analyticsReducer,
  },
});

export default store;
