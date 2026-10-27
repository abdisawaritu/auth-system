export function getAuthErrorMessage(error, fallbackMessage) {
  const status = error?.status ?? error?.statusCode ?? error?.response?.status;

  const code = error?.code ?? error?.response?.data?.code;

  // Network errors: the server could not be reached.
  if (
    code === "ERR_NETWORK" ||
    error?.name === "TypeError" ||
    (!error?.response && error?.message?.toLowerCase().includes("fetch"))
  ) {
    return "We couldn't connect to the server. Check your connection and try again.";
  }

  // Authentication and token errors.
  if (status === 401) {
    return "Your session may have expired, or the information provided is invalid. Please try again.";
  }

  if (status === 403) {
    return "You are not allowed to perform this action.";
  }

  // Missing or invalid request data.
  if (status === 400 || status === 422) {
    return "Some information is invalid or missing. Please check the form and try again.";
  }

  if (status === 404) {
    return "We couldn't find the requested resource. Check the link and try again.";
  }

  if (status === 409) {
    return "This request conflicts with an existing account or operation. Please review your information.";
  }

  if (status === 429) {
    return "Too many attempts. Please wait a little while before trying again.";
  }

  if (status >= 500) {
    return "Something went wrong on our server. Please try again later.";
  }

  // Never display raw backend error messages by default.
  return fallbackMessage || "Something went wrong. Please try again.";
}
