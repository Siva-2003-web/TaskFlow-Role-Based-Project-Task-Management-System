import API from "./axios";

const userService = {
  getAll: () => API.get("/users"),
  getAvailable: () => API.get("/users/available"),
  getById: (id) => API.get(`/users/${id}`),
  create: (userData) => API.post("/users", userData),
  update: (id, userData) => API.put(`/users/${id}`, userData),
  delete: (id) => API.delete(`/users/${id}`),
};

export default userService;
