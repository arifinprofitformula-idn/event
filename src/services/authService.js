let csrfToken = "";

export const setCsrfToken = (token) => {
  csrfToken = token || "";
};

const requestJson = async (url, options = {}) => {
  const method = (options.method || "GET").toUpperCase();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (!["GET", "HEAD", "OPTIONS"].includes(method) && csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  const response = await fetch(url, {
    credentials: "include",
    headers,
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  if (data.csrfToken) setCsrfToken(data.csrfToken);
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
