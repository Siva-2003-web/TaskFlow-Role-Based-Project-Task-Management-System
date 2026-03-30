import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  users: [],
  loading: false,
  error: null,
};

const normalizeUser = (user) => ({
  ...user,
  _id: user._id ?? user.id,
  id: user.id ?? user._id,
  createdAt: user.createdAt ?? user.created_at,
});

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    fetchUsersStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchUsersSuccess(state, action) {
      state.loading = false;
      state.users = (action.payload || []).map(normalizeUser);
    },
    fetchUsersFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    addUser(state, action) {
      state.users.push(normalizeUser(action.payload));
    },
    updateUser(state, action) {
      const incoming = normalizeUser(action.payload);
      const incomingId = incoming._id;
      const idx = state.users.findIndex((u) => (u._id ?? u.id) === incomingId);
      if (idx !== -1) state.users[idx] = incoming;
    },
    removeUser(state, action) {
      state.users = state.users.filter(
        (u) => (u._id ?? u.id) !== action.payload,
      );
    },
    clearUserError(state) {
      state.error = null;
    },
  },
});

export const {
  fetchUsersStart,
  fetchUsersSuccess,
  fetchUsersFailure,
  addUser,
  updateUser,
  removeUser,
  clearUserError,
} = userSlice.actions;
export default userSlice.reducer;
