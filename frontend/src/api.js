import axios from "axios";

const BASE_URL = "/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getStores = () => api.get("/stores");
export const createStore = (data) => api.post("/stores", data);
export const deleteStore = (name) => api.delete(`/stores/${name}`);

export default api;
