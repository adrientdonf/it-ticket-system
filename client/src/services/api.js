import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

export const getTickets = () => api.get("/tickets");
export const createTicket = (data) => api.post("/tickets", data);
export const updateTicket = (id, data) => api.put(`/tickets/${id}`, data);
export const deleteTicket = (id) => api.delete(`/tickets/${id}`);