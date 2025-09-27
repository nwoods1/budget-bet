const BASE =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) ||
  (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_URL) ||
  "http://localhost:8000";

async function parseResponse(res) {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      (isJson && data && data.detail) ||
      (typeof data === "string" && data) ||
      res.statusText ||
      "Request failed";
    const error = new Error(message);
    error.status = res.status;
    error.body = data;
    throw error;
  }

  return data;
}

export async function apiFetch(path, options = {}) {
  const url = `${BASE}${path}`;
  const finalOptions = { ...options };

  if (finalOptions.body && typeof finalOptions.body === "object" && !(finalOptions.body instanceof FormData)) {
    finalOptions.body = JSON.stringify(finalOptions.body);
    finalOptions.headers = {
      "Content-Type": "application/json",
      ...(finalOptions.headers || {}),
    };
  }

  const res = await fetch(url, finalOptions);
  return parseResponse(res);
}

export { BASE as API_BASE_URL };
