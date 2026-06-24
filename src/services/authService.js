const requestJson = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
};

export const authApi = {
  async getSession() {
    return requestJson("/api/auth/session");
  },
  async login(email, password) {
    return requestJson("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },
  async logout() {
    return requestJson("/api/auth/logout", { method: "POST" });
  },
  async listUsers() {
    return requestJson("/api/users");
  },
  async createUser(user) {
    return requestJson("/api/users", {
      method: "POST",
      body: JSON.stringify(user)
    });
  },
  async updateUser(id, patch) {
    return requestJson(`/api/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch)
    });
  },
  async deleteUser(id) {
    return requestJson(`/api/users/${id}`, { method: "DELETE" });
  }
};
