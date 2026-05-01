export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5055";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let message = `API error: ${res.status}`;

    try {
      const errorBody = (await res.json()) as { message?: string; Message?: string };
      message = errorBody.message || errorBody.Message || message;
    } catch {
      message = res.statusText ? `API error: ${res.status} ${res.statusText}` : message;
    }

    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
