import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { notificationsApi } from '@/api/notificationsApi';
import type { NotificationItem } from '@/types';
import { mockNotifications } from '@/utils/mockData';

interface NotificationsState {
  items: NotificationItem[];
}

const initialState: NotificationsState = {
  items: [],
};

export const fetchNotifications = createAsyncThunk('notifications/fetchAll', async () => {
  try {
    const { data } = await notificationsApi.list({ pageNumber: 1, pageSize: 20 });
    const items = data.data.items;
    return items.filter((item, index, all) => all.findIndex((entry) => entry.id === item.id) === index);
  } catch {
    return mockNotifications;
  }
});

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    notificationReceived(state, action: { payload: NotificationItem }) {
      if (state.items.some((item) => item.id === action.payload.id)) {
        state.items = state.items.map((item) => (item.id === action.payload.id ? action.payload : item));
        return;
      }

      state.items = [action.payload, ...state.items];
    },
    notificationMarkedAsRead(state, action: { payload: string }) {
      state.items = state.items.map((item) => (item.id === action.payload ? { ...item, isRead: true } : item));
    },
    notificationsMarkedAllAsRead(state) {
      state.items = state.items.map((item) => ({ ...item, isRead: true }));
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchNotifications.fulfilled, (state, action) => {
      state.items = action.payload;
    });
  },
});

export const { notificationReceived, notificationMarkedAsRead, notificationsMarkedAllAsRead } = notificationsSlice.actions;
export default notificationsSlice.reducer;
