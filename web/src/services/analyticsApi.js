import { request } from "./api";
export const getSummary = () => request("/analytics/summary");
export const getRequests = () => request("/analytics/requests");
export const getThreads = () => request("/analytics/threads");
export const getCache = () => request("/analytics/cache");
export const searchProxy = (url) =>
  request("/proxy/search", { method: "POST", body: JSON.stringify({ url }) });
