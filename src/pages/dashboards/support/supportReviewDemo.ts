import type { AdminIconName } from "../../../components/admin/AdminIcons";

export type ReviewStatus = "pending" | "published" | "rejected";

export const reviewStatuses = {
  pending: { label: "Chờ duyệt", icon: "clock", caption: "Đã hoàn thành, cần kiểm tra" },
  published: { label: "Đã công khai", icon: "check", caption: "Mẫu hiển thị với Người dân" },
  rejected: { label: "Không duyệt", icon: "close", caption: "Hồ sơ nghiệp vụ vẫn được giữ" },
} satisfies Record<ReviewStatus, { label: string; icon: AdminIconName; caption: string }>;

export interface ReviewCase {
  id: string;
  status: ReviewStatus;
  category: string;
  icon: AdminIconName;
  area: string;
  address: string;
  coordinates: string;
  summary: string;
  outcome: string;
  unit: string;
  occurred: number;
  received: number;
  completed: number;
  images: number;
  publicText: string;
  publicImages: number[];
  reason?: string;
}

const examples = [
  {
    id: "HS-261126-084", category: "Tai nạn giao thông", icon: "vehicle", area: "Quận 3",
    address: "Ngã tư Nguyễn Thị Minh Khai – Cách Mạng Tháng 8, Quận 3",
    coordinates: "10.7732, 106.6868", unit: "Đội CSGT Quận 3", images: 2,
    summary: "Va chạm giữa ô tô và xe máy tại giao lộ. Giao thông đã được khôi phục sau khi lực lượng chức năng xử lý.",
    outcome: "Hai bên đã được hỗ trợ, hiện trường được giải tỏa và giao thông trở lại bình thường.",
    start: "2026-11-25T18:42:00+07:00", finish: "2026-11-25T20:15:00+07:00",
  },
  {
    id: "HS-261126-079", category: "Mất trật tự công cộng", icon: "users", area: "Quận 1",
    address: "Khu vực đường Lê Thánh Tôn, Quận 1", coordinates: "10.7760, 106.7011", unit: "Đội tuần tra Quận 1", images: 1,
    summary: "Tụ tập gây tiếng ồn trước cửa hàng. Lực lượng tuần tra đã nhắc nhở và ổn định khu vực.",
    outcome: "Khu vực trở lại hoạt động bình thường.",
    start: "2026-11-25T16:08:00+07:00", finish: "2026-11-25T17:22:00+07:00",
  },
  {
    id: "HS-261125-148", category: "Cháy nhỏ", icon: "flame", area: "TP. Thủ Đức",
    address: "Khu vực đường Võ Văn Ngân, TP. Thủ Đức", coordinates: "10.8517, 106.7719", unit: "Đội PCCC TP. Thủ Đức", images: 2,
    summary: "Sự cố cháy nhỏ tại khu vực kỹ thuật đã được khống chế, không có thương vong.",
    outcome: "Đám cháy được dập tắt, khu vực đã được kiểm tra.",
    start: "2026-11-24T09:35:00+07:00", finish: "2026-11-24T10:12:00+07:00",
  },
  {
    id: "HS-261125-121", category: "Cây xanh ngã đổ", icon: "tree", area: "Quận Bình Thạnh",
    address: "Khu vực đường Điện Biên Phủ, Quận Bình Thạnh", coordinates: "10.8011, 106.7085", unit: "Đội phản ứng nhanh", images: 0,
    summary: "Cây xanh ngã chắn một phần làn đường sau mưa lớn, đã được di dời.",
    outcome: "Làn đường được mở lại sau khi đã dọn hiện trường.",
    start: "2026-11-24T07:20:00+07:00", finish: "2026-11-24T08:46:00+07:00",
  },
] as const;

export const demoNow = Date.parse("2026-11-26T20:36:00+07:00");
export const day = 86_400_000;

export const reviewDemoCases: ReviewCase[] = (["pending", "published", "rejected"] as const).flatMap((status) => {
  const size = { pending: 4, published: 28, rejected: 6 }[status];
  return Array.from({ length: size }, (_, index) => {
    const item = examples[index % examples.length];
    const offset = Math.floor(index / examples.length) * day;
    const occurred = Date.parse(item.start) - offset;
    return {
      ...item, status, occurred, received: occurred + 4 * 60_000, completed: Date.parse(item.finish) - offset,
      id: status === "pending" ? item.id : `HS-M${status === "published" ? "C" : "K"}-${String(index + 1).padStart(3, "0")}`,
      publicText: item.summary, publicImages: item.images ? [0] : [],
      reason: status === "rejected" ? "Nội dung mẫu cần rà soát thêm trước khi công khai." : undefined,
    };
  });
});

const dateFormat = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit",
  day: "2-digit", month: "2-digit", year: "numeric",
});

export const formatReviewTime = (value: number) => dateFormat.format(value);

export function waitingTime(completed: number) {
  const minutes = Math.floor((demoNow - completed) / 60_000);
  const hours = Math.floor(minutes / 60);
  return hours >= 24 ? `${Math.floor(hours / 24)} ngày ${hours % 24} giờ` : `${hours} giờ ${minutes % 60} phút`;
}
