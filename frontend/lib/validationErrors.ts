import axios from "axios";

// Only field validation belongs inline; callers use safe, fixed toast messages
// for other failures instead of displaying arbitrary server responses.
export function getValidationErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError<{ errors?: unknown }>(error) || error.response?.status !== 422) {
    return {};
  }

  const errors = error.response.data?.errors;
  if (!errors || typeof errors !== "object" || Array.isArray(errors)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(errors).flatMap(([field, messages]) =>
      Array.isArray(messages) && typeof messages[0] === "string" && messages[0]
        ? [[field, messages[0]]]
        : []
    )
  );
}
