const API = "/api";
export async function request(path, options = {}) {
  const token = sessionStorage.getItem("relay_token");
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(data?.error || "Request failed.");
  return data;
}
