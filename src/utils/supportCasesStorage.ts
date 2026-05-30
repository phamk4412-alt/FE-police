import type { Incident } from "../types/incident";

export const SUPPORT_CASES_STORAGE_KEY = "support_cases";

export const defaultSupportCases: Incident[] = [
  {
    id: "support-001",
    title: "Yêu cầu hỗ trợ hiện trường",
    detail: "Người dân báo cần hỗ trợ điều tiết và xử lý tình huống tại hiện trường.",
    category: "Hỗ trợ hiện trường",
    level: "medium",
    latitude: 10.776889,
    longitude: 106.700981,
    status: "Mới tiếp nhận",
    createdAt: new Date().toISOString(),
    phone: "0900000001",
    reporterName: "Người báo cáo 1",
    imageUrls: [],
  },
  {
    id: "support-002",
    title: "Vụ án đã hoàn thành",
    detail: "Hồ sơ đã được xử lý xong và có thể xóa khỏi danh sách làm việc.",
    category: "Vụ án",
    level: "low",
    latitude: 10.7536,
    longitude: 106.6728,
    status: "completed",
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    phone: "0900000002",
    reporterName: "Người báo cáo 2",
    imageUrls: [],
  },
];

export function loadSupportCases() {
  if (typeof window === "undefined") {
    return defaultSupportCases;
  }

  const savedCases = window.localStorage.getItem(SUPPORT_CASES_STORAGE_KEY);

  if (!savedCases) {
    return defaultSupportCases;
  }

  try {
    const parsedCases = JSON.parse(savedCases) as unknown;
    return Array.isArray(parsedCases) ? (parsedCases as Incident[]) : defaultSupportCases;
  } catch {
    return defaultSupportCases;
  }
}

export function saveSupportCases(cases: Incident[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SUPPORT_CASES_STORAGE_KEY, JSON.stringify(cases));
}
