import axios from "axios";
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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
