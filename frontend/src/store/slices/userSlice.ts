import { createSlice } from '@reduxjs/toolkit';
import type { User } from '@/types';

interface UserState {
  profile: User | null;
}

const initialState: UserState = {
  profile: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile(state, action: { payload: User | null }) {
      state.profile = action.payload;
    },
  },
});

export const { setProfile } = userSlice.actions;
export default userSlice.reducer;

