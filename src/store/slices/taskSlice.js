import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  tasks: [],
  currentTask: null,
  loading: false,
  error: null,
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    fetchTasksStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchTasksSuccess(state, action) {
      state.loading = false;
      state.tasks = action.payload;
    },
    fetchTasksFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    setCurrentTask(state, action) {
      state.currentTask = action.payload;
    },
    addTask(state, action) {
      state.tasks.push(action.payload);
    },
    updateTask(state, action) {
      const idx = state.tasks.findIndex((t) => t._id === action.payload._id);
      if (idx !== -1) state.tasks[idx] = action.payload;
      if (state.currentTask?._id === action.payload._id) {
        state.currentTask = action.payload;
      }
    },
    removeTask(state, action) {
      state.tasks = state.tasks.filter((t) => t._id !== action.payload);
      if (state.currentTask?._id === action.payload) {
        state.currentTask = null;
      }
    },
    clearTaskError(state) {
      state.error = null;
    },
  },
});

export const {
  fetchTasksStart,
  fetchTasksSuccess,
  fetchTasksFailure,
  setCurrentTask,
  addTask,
  updateTask,
  removeTask,
  clearTaskError,
} = taskSlice.actions;
export default taskSlice.reducer;
