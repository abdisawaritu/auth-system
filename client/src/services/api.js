const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, status = null, data = null, code = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.code = code;
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
    throw new ApiError(
      "The server could not be reached.",
      null,
      null,
      "NETWORK_ERROR",
    );
  }

  const contentType = response.headers.get("content-type") || "";
  let data = null;

  if (response.status !== 204) {
    if (contentType.includes("application/json")) {
      try {
        data = await response.json();
      } catch {
        throw new ApiError(
          "The server returned an unreadable response.",
          response.status,
          null,
          "INVALID_RESPONSE",
        );
      }
    } else {
      data = await response.text();
    }
  }

  if (!response.ok) {
    // Keep the server response for controlled error mapping.
    // UI components should not display this message directly.
    const serverMessage =
      data && typeof data === "object" && typeof data.message === "string"
        ? data.message
        : null;

    throw new ApiError(
      serverMessage || "The request could not be completed.",
      response.status,
      data,
      data && typeof data === "object" ? (data.code ?? null) : null,
    );
  }

  return data;
}
