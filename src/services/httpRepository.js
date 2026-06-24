export function createHttpRepository({ baseUrl = "", resource, fallbackValue, responseKey }) {
  const endpoint = `${baseUrl.replace(/\/$/, "")}/${resource.replace(/^\//, "")}`;

  return {
    fallbackValue,
    async load() {
      const response = await fetch(endpoint, { credentials: "include" });
      if (!response.ok) return fallbackValue;
      const data = await response.json();
      return responseKey ? data[responseKey] : data;
    },
    async save(value) {
      const response = await fetch(endpoint, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(responseKey ? { [responseKey]: value } : value)
      });
      if (!response.ok) throw new Error(`Failed to save ${resource}`);
      const data = await response.json();
      return responseKey ? data[responseKey] : data;
    }
  };
}
