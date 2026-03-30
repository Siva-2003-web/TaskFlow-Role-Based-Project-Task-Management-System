import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
};

const normalizeProject = (project) => ({
  ...project,
  _id: project._id ?? project.id,
  id: project.id ?? project._id,
});

const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    fetchProjectsStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchProjectsSuccess(state, action) {
      state.loading = false;
      state.projects = (action.payload || []).map(normalizeProject);
    },
    fetchProjectsFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    setCurrentProject(state, action) {
      state.currentProject = action.payload
        ? normalizeProject(action.payload)
        : null;
    },
    addProject(state, action) {
      state.projects.push(normalizeProject(action.payload));
    },
    updateProject(state, action) {
      const normalized = normalizeProject(action.payload);
      const idx = state.projects.findIndex(
        (p) => (p._id ?? p.id) === (normalized._id ?? normalized.id),
      );
      if (idx !== -1) state.projects[idx] = normalized;
      if (
        state.currentProject &&
        (state.currentProject._id ?? state.currentProject.id) ===
          (normalized._id ?? normalized.id)
      ) {
        state.currentProject = normalized;
      }
    },
    removeProject(state, action) {
      state.projects = state.projects.filter(
        (p) => (p._id ?? p.id) !== action.payload,
      );
      if (
        state.currentProject &&
        (state.currentProject._id ?? state.currentProject.id) === action.payload
      ) {
        state.currentProject = null;
      }
    },
    clearProjectError(state) {
      state.error = null;
    },
  },
});

export const {
  fetchProjectsStart,
  fetchProjectsSuccess,
  fetchProjectsFailure,
  setCurrentProject,
  addProject,
  updateProject,
  removeProject,
  clearProjectError,
} = projectSlice.actions;
export default projectSlice.reducer;
