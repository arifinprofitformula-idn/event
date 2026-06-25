import { setCsrfToken } from "./authService.js";

let repositoryCsrfToken = "";

export const setRepositoryCsrfToken = (token) => {
  repositoryCsrfToken = token || "";
  setCsrfToken(token);
};

export function createHttpRepository({ baseUrl = "", resource, fallbackValue, responseKey }) {
  const endpoint = `${baseUrl.replace(/\/$/, "")}/${resource.replace(/^\//, "")}`;

  return {
    fallbackValue,
    async load() {
      const response = await fetch(endpoint, { credentials: "include" });
      if (!response.ok) return fallbackValue;
      const data = await response.json();
      if (data.csrfToken) setRepositoryCsrfToken(data.csrfToken);
      return responseKey ? data[responseKey] : data;
    },
    async save(value) {
      const response = await fetch(endpoint, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(repositoryCsrfToken ? { "X-CSRF-Token": repositoryCsrfToken } : {}) },
        body: JSON.stringify(responseKey ? { [responseKey]: value } : value)
      });
      if (!response.ok) throw new Error(`Failed to save ${resource}`);
      const data = await response.json();
      if (data.csrfToken) setRepositoryCsrfToken(data.csrfToken);
      return responseKey ? data[responseKey] : data;
    }
  };
}
