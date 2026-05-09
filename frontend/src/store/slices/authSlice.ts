import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { isAxiosError } from 'axios';
import { authApi, type LoginPayload, type RegisterPayload } from '@/api/authApi';
import { setActiveTokens } from '@/api/client';
import type { AuthTokens } from '@/types';
import { normalizeUser } from '@/utils/roles';
import { storage } from '@/utils/storage';

interface AuthState {
  session: AuthTokens | null;
  isAuthenticated: boolean;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const cached = storage.getAuth();
const normalizeSession = (session: AuthTokens | null): AuthTokens | null =>
  session
    ? {
        ...session,
        user: normalizeUser(session.user),
      }
    : null;

const initialState: AuthState = {
  session: normalizeSession(cached),
  isAuthenticated: Boolean(cached?.accessToken),
  status: 'idle',
  error: null,
};

export const login = createAsyncThunk('auth/login', async (payload: LoginPayload, { rejectWithValue }) => {
  try {
    const { data } = await authApi.login(payload);
    return normalizeSession(data.data);
  } catch (error) {
    if (isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.message ?? 'Login failed. Please try again.');
    }
    return rejectWithValue('Login failed. Please try again.');
  }
});

export const register = createAsyncThunk('auth/register', async (payload: RegisterPayload, { rejectWithValue }) => {
  try {
    const { data } = await authApi.register(payload);
    return normalizeSession(data.data);
  } catch (error) {
    if (isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.message ?? 'Registration failed. Please try again.');
    }
    return rejectWithValue('Registration failed. Please try again.');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.session = null;
      state.isAuthenticated = false;
      state.error = null;
      setActiveTokens(null);
    },
    hydrateSession(state, action: { payload: AuthTokens | null }) {
      state.session = normalizeSession(action.payload);
      state.isAuthenticated = Boolean(action.payload?.accessToken);
      state.error = null;
      setActiveTokens(normalizeSession(action.payload));
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.session = action.payload;
        state.isAuthenticated = true;
        state.error = null;
        setActiveTokens(action.payload);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.isAuthenticated = false;
        state.session = null;
        state.error = (action.payload as string) || action.error.message || 'Login failed. Please try again.';
      })
      .addCase(register.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.session = action.payload;
        state.isAuthenticated = true;
        state.error = null;
        setActiveTokens(action.payload);
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed';
        state.isAuthenticated = false;
        state.session = null;
        state.error = (action.payload as string) || action.error.message || 'Registration failed. Please try again.';
      });
  },
});

export const { logout, hydrateSession, clearError } = authSlice.actions;
export default authSlice.reducer;
