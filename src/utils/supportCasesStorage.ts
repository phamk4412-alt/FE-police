import type { Incident } from "../types/incident";

export const SUPPORT_CASES_STORAGE_KEY = "support_cases";

export const defaultSupportCases: Incident[] = [
  {
    id: "support-001",
    title: "Yeu cau ho tro hien truong",
    detail: "Nguoi dan bao can ho tro dieu tiet va xu ly tinh huong tai hien truong.",
    category: "Ho tro hien truong",
    level: "medium",
    latitude: 10.776889,
    longitude: 106.700981,
    status: "Moi tiep nhan",
    createdAt: new Date().toISOString(),
    phone: "0900000001",
    reporterName: "Nguoi bao cao 1",
    imageUrls: [],
  },
  {
    id: "support-002",
    title: "Vu an da hoan thanh",
    detail: "Ho so da duoc xu ly xong va co the xoa khoi danh sach lam viec.",
    category: "Vu an",
    level: "low",
    latitude: 10.7536,
    longitude: 106.6728,
    status: "completed",
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    phone: "0900000002",
    reporterName: "Nguoi bao cao 2",
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
