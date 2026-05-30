const isLocalHost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

export const API_URL =
  import.meta.env.VITE_API_URL ||
  (isLocalHost ? "http://localhost:5055" : "https://be-police-n8zf.onrender.com");

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const timeoutMs = 30000;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      signal: options.signal || controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("API quá thời gian phản hồi. Vui lòng thử lại.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!res.ok) {
    let message = `API error: ${res.status}`;

    try {
      const errorBody = (await res.json()) as {
        detail?: string;
        Detail?: string;
        message?: string;
        Message?: string;
        title?: string;
        Title?: string;
      };
      message =
        errorBody.message ||
        errorBody.Message ||
        errorBody.detail ||
        errorBody.Detail ||
        errorBody.title ||
        errorBody.Title ||
        message;
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
