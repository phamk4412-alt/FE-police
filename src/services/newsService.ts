import { API_URL, apiFetch } from "./api";
import type { NationalEvent, NewsArticle, NewsPayload } from "../types/news";

export function resolveMediaUrl(url: string) {
  if (!url) {
    return "";
  }

  if (/^https?:\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }

  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function unwrapList<T>(payload: T[] | { data?: T[]; Data?: T[]; items?: T[]; Items?: T[] }) {
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload.data || payload.Data || payload.items || payload.Items || [];
}

export async function getNews() {
  return unwrapList(await apiFetch<NewsArticle[] | { data?: NewsArticle[]; Data?: NewsArticle[]; items?: NewsArticle[]; Items?: NewsArticle[] }>("/api/news"));
}

export async function getFeaturedNews() {
  return unwrapList(await apiFetch<NewsArticle[] | { data?: NewsArticle[]; Data?: NewsArticle[]; items?: NewsArticle[]; Items?: NewsArticle[] }>("/api/news/featured"));
}

export function getNewsById(id: string) {
  return apiFetch<NewsArticle>(`/api/news/${encodeURIComponent(id)}`);
}

export async function getUpcomingEvents() {
  return unwrapList(await apiFetch<NationalEvent[] | { data?: NationalEvent[]; Data?: NationalEvent[]; items?: NationalEvent[]; Items?: NationalEvent[] }>("/api/events/upcoming"));
}

export async function getSupportNews() {
  try {
    return unwrapList(
      await apiFetch<
        NewsArticle[] | { data?: NewsArticle[]; Data?: NewsArticle[]; items?: NewsArticle[]; Items?: NewsArticle[] }
      >("/api/support/news"),
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("401")) {
      return getNews();
    }

    throw error;
  }
}

export function createSupportNews(payload: NewsPayload) {
  return apiFetch<NewsArticle>("/api/support/news", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function updateSupportNews(id: string, payload: NewsPayload) {
  return apiFetch<NewsArticle>(`/api/support/news/${encodeURIComponent(id)}`, {
    body: JSON.stringify(payload),
    method: "PUT",
  });
}

export function deleteSupportNews(id: string) {
  return apiFetch<void>(`/api/support/news/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function updateSupportNewsStatus(id: string, status: string) {
  return apiFetch<NewsArticle>(`/api/support/news/${encodeURIComponent(id)}/status`, {
    body: JSON.stringify({ status }),
    method: "PATCH",
  });
}

export function updateSupportNewsFeatured(id: string, isFeatured: boolean, featuredOrder: number | null) {
  return apiFetch<NewsArticle>(`/api/support/news/${encodeURIComponent(id)}/featured`, {
    body: JSON.stringify({ featuredOrder, isFeatured }),
    method: "PATCH",
  });
}
