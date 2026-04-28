import { createSlice } from '@reduxjs/toolkit';
import type { ChatMessage } from '@/types';

interface ChatState {
  messages: ChatMessage[];
}

const initialState: ChatState = {
  messages: [],
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    messageReceived(state, action: { payload: ChatMessage }) {
      const existingIndex = state.messages.findIndex((message) => message.id === action.payload.id);
      if (existingIndex >= 0) {
        state.messages[existingIndex] = action.payload;
        return;
      }

      state.messages.push(action.payload);
    },
    hydrateMessages(state, action: { payload: ChatMessage[] }) {
      state.messages = action.payload;
    },
  },
});

export const { messageReceived, hydrateMessages } = chatSlice.actions;
export default chatSlice.reducer;
