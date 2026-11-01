export type StatusGroup = "new" | "processing" | "completed";
export type PolicePeriod = "all" | "week" | "month";
export const statusLabels: Record<StatusGroup, string> = { new: "Vụ việc mới", processing: "Đang xử lý", completed: "Hoàn thành" };
export function normalizePoliceText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();
}
export function getStatusGroup(status: string): StatusGroup {
  const value = normalizePoliceText(status);
  if (["completed", "done", "resolved", "hoan thanh", "da hoan thanh", "da xu ly"].includes(value)) return "completed";
  if (["new", "pending", "moi", "moi tiep nhan", "cho xu ly"].includes(value)) return "new";
  return "processing";
}
export function matchesPoliceSearch(query: string, values: string[]) { return normalizePoliceText(values.join(" ")).includes(normalizePoliceText(query)); }
export function formatPoliceTime(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(date) : "Chưa ghi nhận";
}
export function isInPolicePeriod(value: string, period: PolicePeriod, now = new Date()) {
  if (period === "all") return true;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return false;
  const vietnamNow = new Date(now.getTime() + 7 * 3600000);
  const start = new Date(Date.UTC(vietnamNow.getUTCFullYear(), vietnamNow.getUTCMonth(), period === "month" ? 1 : vietnamNow.getUTCDate()));
  if (period === "week") start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  return date.getTime() >= start.getTime() - 7 * 3600000 && date.getTime() <= now.getTime();
}
