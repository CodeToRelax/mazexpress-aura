import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserACLData, ACLFlags } from '@/types/acl';
import type { RootState } from './index';

interface ACLState {
  acl: UserACLData | null;
  isLoaded: boolean;
  error: string | null;
}

const initialState: ACLState = {
  acl: null,
  isLoaded: false,
  error: null,
};

const aclSlice = createSlice({
  name: 'acl',
  initialState,
  reducers: {
    setACL: (state, action: PayloadAction<UserACLData>) => {
      state.acl = action.payload;
      state.isLoaded = true;
      state.error = null;
    },
    clearACL: (state) => {
      state.acl = null;
      state.isLoaded = false;
      state.error = null;
    },
    setACLError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoaded = true;
    },
    updateACLFlags: (state, action: PayloadAction<Partial<ACLFlags>>) => {
      if (state.acl) {
        state.acl.frontendFlags = {
          ...state.acl.frontendFlags,
          ...action.payload,
        };
      }
    },
  },
});

export const { setACL, clearACL, setACLError, updateACLFlags } = aclSlice.actions;

// Selectors
export const selectUserACL = (state: RootState) => state.acl.acl;
export const selectACLFlags = (state: RootState) => state.acl.acl?.frontendFlags;
export const selectACLLoaded = (state: RootState) => state.acl.isLoaded;
export const selectACLError = (state: RootState) => state.acl.error;
export const selectIsAdmin = (state: RootState) => state.acl.acl?.userType === 'admin';

export default aclSlice.reducer;
