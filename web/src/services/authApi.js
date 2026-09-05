import { request } from "./api";
export const login = (identifier, password) =>
  request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });
export const signup = (payload) =>
  request("/auth/signup", { method: "POST", body: JSON.stringify(payload) });
export const logout = () => request("/auth/logout", { method: "POST" });
export const me = () => request("/auth/me");
