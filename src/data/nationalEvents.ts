export interface LocalNationalEvent {
  id: string;
  name: string;
  fullDescription: string;
  eventDate: string;
  image: string;
  sortOrder: number;
}

export const nationalEvents: LocalNationalEvent[] = [
  {
    id: "tet-nguyen-dan-2026",
    name: "Tết Nguyên Đán",
    fullDescription: "Tết Nguyên Đán.",
    eventDate: "2026-02-17",
    image: "/event-images/tet-nguyen-dan.png",
    sortOrder: 10,
  },
  {
    id: "gio-to-hung-vuong-2026",
    name: "Giỗ Tổ Hùng Vương",
    fullDescription: "Giỗ Tổ Hùng Vương.",
    eventDate: "2026-04-26",
    image: "/event-images/gio-to-hung-vuong.png",
    sortOrder: 20,
  },
  {
    id: "giai-phong-mien-nam-2026",
    name: "30/4",
    fullDescription: "Ngày Giải phóng miền Nam, thống nhất đất nước.",
    eventDate: "2026-04-30",
    image: "/event-images/giai-phong-mien-nam.png",
    sortOrder: 30,
  },
  {
    id: "quoc-te-lao-dong-2026",
    name: "1/5",
    fullDescription: "Ngày Quốc tế Lao động.",
    eventDate: "2026-05-01",
    image: "/event-images/quoc-te-lao-dong.png",
    sortOrder: 40,
  },
  {
    id: "quoc-khanh-vn-2026",
    name: "2/9",
    fullDescription: "Ngày Quốc khánh nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.",
    eventDate: "2026-09-02",
    image: "/event-images/quoc-khanh-vn.png",
    sortOrder: 50,
  },
  {
    id: "giang-sinh-2026",
    name: "Giáng sinh",
    fullDescription: "Ngày Giáng sinh.",
    eventDate: "2026-12-25",
    image: "/event-images/giang-sinh.png",
    sortOrder: 60,
  },
  {
    id: "tet-duong-lich-2027",
    name: "Tết Dương Lịch",
    fullDescription: "Tết Dương Lịch.",
    eventDate: "2027-01-01",
    image: "/event-images/tet-duong-lich.png",
    sortOrder: 70,
  },
];
