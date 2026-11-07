export type DemoShiftStatus = "on-duty" | "break" | "off-duty";
export type DemoConnectionStatus = "connected" | "disconnected";

export interface DemoOfficer {
  id: string;
  name: string;
  initials: string;
  accountCode: string;
  unit: string;
  shiftStatus: DemoShiftStatus;
  connectionStatus: DemoConnectionStatus;
  shiftStartedAt: string | null;
  gpsLocation: string | null;
  gpsUpdatedAt: string | null;
  /** Sơ đồ tương đối dành riêng cho minh họa UI, không phải tọa độ GPS. */
  mapPosition: { left: number; top: number } | null;
}

/** Dữ liệu tĩnh để dựng giao diện; thay bằng API sau khi thống nhất hợp đồng dữ liệu. */
export const supportOfficerDemoData: DemoOfficer[] = [
  {
    id: "demo-ca-1628",
    name: "Trần Quốc Bảo",
    initials: "QB",
    accountCode: "CA-1628",
    unit: "Đội phản ứng nhanh",
    shiftStatus: "on-duty",
    connectionStatus: "connected",
    shiftStartedAt: "13:45",
    gpsLocation: "Cầu Khánh Hội, Quận 4",
    gpsUpdatedAt: "2 phút trước",
    mapPosition: { left: 47, top: 35 },
  },
  {
    id: "demo-ca-1732",
    name: "Nguyễn Hoàng Minh",
    initials: "HM",
    accountCode: "CA-1732",
    unit: "Đội tuần tra Quận 3",
    shiftStatus: "on-duty",
    connectionStatus: "disconnected",
    shiftStartedAt: "14:00",
    gpsLocation: "Vòng xoay Dân Chủ, Quận 3",
    gpsUpdatedAt: "12 phút trước",
    mapPosition: { left: 31, top: 47 },
  },
  {
    id: "demo-ca-1519",
    name: "Lê Hữu Nhân",
    initials: "HN",
    accountCode: "CA-1519",
    unit: "Đội tuần tra Quận 1",
    shiftStatus: "on-duty",
    connectionStatus: "connected",
    shiftStartedAt: "14:00",
    gpsLocation: "Đường Nguyễn Huệ, Quận 1",
    gpsUpdatedAt: "Vừa xong",
    mapPosition: { left: 54, top: 59 },
  },
  {
    id: "demo-ca-1456",
    name: "Phạm Gia Huy",
    initials: "GH",
    accountCode: "CA-1456",
    unit: "Đội tuần tra Quận 1",
    shiftStatus: "break",
    connectionStatus: "connected",
    shiftStartedAt: "08:00",
    gpsLocation: "Trụ sở Công an Quận 1",
    gpsUpdatedAt: "6 phút trước",
    mapPosition: { left: 70, top: 43 },
  },
  {
    id: "demo-ca-1884",
    name: "Võ Thanh Tùng",
    initials: "TT",
    accountCode: "CA-1884",
    unit: "Đội tuần tra Quận 3",
    shiftStatus: "break",
    connectionStatus: "disconnected",
    shiftStartedAt: "08:00",
    gpsLocation: null,
    gpsUpdatedAt: null,
    mapPosition: null,
  },
  {
    id: "demo-ca-1902",
    name: "Đặng Minh Khoa",
    initials: "MK",
    accountCode: "CA-1902",
    unit: "Đội tuần tra Quận 5",
    shiftStatus: "off-duty",
    connectionStatus: "connected",
    shiftStartedAt: null,
    gpsLocation: null,
    gpsUpdatedAt: null,
    mapPosition: null,
  },
  {
    id: "demo-ca-1977",
    name: "Bùi Anh Tuấn",
    initials: "AT",
    accountCode: "CA-1977",
    unit: "Đội tuần tra Quận 10",
    shiftStatus: "off-duty",
    connectionStatus: "disconnected",
    shiftStartedAt: null,
    gpsLocation: null,
    gpsUpdatedAt: null,
    mapPosition: null,
  },
  {
    id: "demo-ca-1841",
    name: "Ngô Thành Đạt",
    initials: "TĐ",
    accountCode: "CA-1841",
    unit: "Đội phản ứng nhanh",
    shiftStatus: "off-duty",
    connectionStatus: "connected",
    shiftStartedAt: null,
    gpsLocation: null,
    gpsUpdatedAt: null,
    mapPosition: null,
  },
];
