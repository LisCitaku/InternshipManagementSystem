import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { internshipsApi, type InternshipSearchParams } from '@/api/internshipsApi';
import type { Internship } from '@/types';
import { mockInternships } from '@/utils/mockData';

interface InternshipsState {
  items: Internship[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: InternshipsState = {
  items: [],
  status: 'idle',
};

export const fetchInternships = createAsyncThunk('internships/fetchAll', async (params: InternshipSearchParams) => {
  try {
    const { data } = await internshipsApi.list(params);
    return data.data.items;
  } catch {
    return mockInternships;
  }
});

const internshipsSlice = createSlice({
  name: 'internships',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInternships.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchInternships.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      });
  },
});

export default internshipsSlice.reducer;

