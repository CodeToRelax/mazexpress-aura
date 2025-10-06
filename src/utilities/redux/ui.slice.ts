import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  isSubmitting: boolean;
  globalLoading: boolean;
  theme: 'light' | 'dark';
}

const initialState: UiState = {
  isSubmitting: false,
  globalLoading: true, // Start with loading during Firebase init
  theme: 'light',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      document.documentElement.classList.toggle('dark', action.payload === 'dark');
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', state.theme === 'dark');
    },
  },
});

export const { setSubmitting, setGlobalLoading, setTheme, toggleTheme } = uiSlice.actions;
export default uiSlice.reducer;
