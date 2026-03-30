import API from "./axios";

const projectService = {
  getAll: () => API.get("/projects"),
  getById: (id) => API.get(`/projects/${id}`),
  create: (projectData) => API.post("/projects", projectData),
  update: (id, projectData) => API.put(`/projects/${id}`, projectData),
  delete: (id) => API.delete(`/projects/${id}`),
  // Add a single member to project
  addMember: (projectId, userId) =>
    API.post(`/projects/${projectId}/members`, { userId }),
  // Batch add multiple members
  addMembers: async (projectId, userIds) => {
    const results = await Promise.all(
      userIds.map((userId) =>
        API.post(`/projects/${projectId}/members`, { userId }),
      ),
    );
    return results;
  },
};

export default projectService;
