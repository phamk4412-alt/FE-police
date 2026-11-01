import { API_URL, apiFetch } from "./api";
import { getAuthToken } from "../auth/authToken";
import type { Incident } from "../types/incident";

export async function getPoliceIncidents(signal?: AbortSignal) {
  const timeout = AbortSignal.timeout(30000);
  try {
    const items = await apiFetch<Incident[]>("/api/police/cases?sort=created_desc", { signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
    if (!Array.isArray(items)) throw new Error("Dữ liệu vụ việc trả về không hợp lệ. Vui lòng thử lại.");
    return items;
  } catch (error) {
    if (error instanceof TypeError) throw new Error("Không kết nối được máy chủ. Vui lòng kiểm tra kết nối và thử lại.", { cause: error });
    if (error instanceof DOMException && ["TimeoutError", "AbortError"].includes(error.name)) throw new Error("Tải vụ việc quá thời gian chờ. Vui lòng thử lại.", { cause: error });
    throw error;
  }
}

export async function createPoliceReport(data: FormData): Promise<Incident> {
  const token = getAuthToken();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${API_URL}/api/police/reports`, {
      method: "POST", body: data, credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: controller.signal,
    });
    const result = await response.json().catch(() => null) as { Incident?: Incident; message?: string; Message?: string } | null;
    if (!response.ok) throw new Error(result?.message || result?.Message || `Không gửi được báo cáo (${response.status}). Vui lòng thử lại.`);
    if (!result?.Incident) throw new Error("Máy chủ chưa trả về báo cáo. Hãy kiểm tra danh sách trước khi gửi lại.");
    return result.Incident;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("Gửi báo cáo quá thời gian chờ. Hãy kiểm tra danh sách trước khi thử lại.", { cause: error });
    if (error instanceof TypeError) throw new Error("Không kết nối được máy chủ. Báo cáo chưa được xác nhận; hãy kiểm tra danh sách trước khi thử lại.", { cause: error });
    throw error;
  } finally { window.clearTimeout(timeout); }
}
