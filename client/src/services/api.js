const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest(
  path,
  { method = "GET", body, headers = {}, ...options } = {},
) {
  const normalizedPath = path.replace(/^\/+/, "");
  const url = `${API_BASE_URL}/${normalizedPath}`;

  const requestHeaders = new Headers(headers);

  const requestOptions = {
    ...options,
    method,
    headers: requestHeaders,

    // Send and receive session cookies.
    credentials: "include",
  };

  if (body !== undefined) {
    if (body instanceof FormData || body instanceof URLSearchParams) {
      requestOptions.body = body;
    } else {
      requestHeaders.set("Content-Type", "application/json");
      requestOptions.body = JSON.stringify(body);
    }
  }

  let response;

  try {
    response = await fetch(url, requestOptions);
  } catch {
    throw new Error(
      "Unable to connect to the server. Check that the backend is running and the API URL is correct.",
    );
  }

  const contentType = response.headers.get("content-type") || "";
  let data = null;

  if (response.status !== 204) {
    if (contentType.includes("application/json")) {
      try {
        data = await response.json();
      } catch {
        throw new Error("The server returned invalid JSON.");
      }
    } else {
      data = await response.text();
    }
  }

  if (!response.ok) {
    const message =
      data && typeof data === "object" && typeof data.message === "string"
        ? data.message
        : typeof data === "string" && data.trim()
          ? data
          : `Request failed with status ${response.status}.`;

    throw new ApiError(message, response.status, data);
  }

  return data;
}
