import type { AdminIconName } from "../admin/AdminIcons";
import type { UserRole } from "../../types/user";
import { ROLE_HOME_PATHS, SUPPORT_TAB_PATHS } from "../../utils/constants";

export type SidebarRole = Exclude<UserRole, "admin">;

type SidebarItem = {
  label: string;
  to: string;
  icon: AdminIconName;
  includeChildren?: boolean;
};

type SidebarGroup = { label: string; items: SidebarItem[] };

const settings = { label: "Cài đặt", to: "#settings", icon: "settings" } as const;

export const sidebarGroups: Record<SidebarRole, SidebarGroup[]> = {
  user: [
    { label: "Dịch vụ", items: [
      { label: "Bảng điều khiển", to: ROLE_HOME_PATHS.user, icon: "chart" },
      { label: "Bản đồ", to: "/user/map", icon: "map" },
      { label: "Tin tức", to: "/user/news", icon: "file", includeChildren: true },
    ] },
    { label: "Hệ thống", items: [settings] },
  ],
  support: [
    { label: "Điều hành", items: [
      { label: "Bản đồ", to: `${SUPPORT_TAB_PATHS.duty}#map`, icon: "map" },
      { label: "Theo dõi Công an", to: SUPPORT_TAB_PATHS.tracking, icon: "users", includeChildren: true },
      { label: "Thường trực", to: SUPPORT_TAB_PATHS.duty, icon: "activity" },
    ] },
    { label: "Nội dung", items: [
      { label: "Duyệt vụ việc", to: SUPPORT_TAB_PATHS.review, icon: "review" },
      { label: "Tin tức", to: SUPPORT_TAB_PATHS.news, icon: "file", includeChildren: true },
    ] },
    { label: "Hệ thống", items: [settings] },
  ],
  police: [
    { label: "Điều hành", items: [
      { label: "Bảng điều khiển", to: ROLE_HOME_PATHS.police, icon: "chart" },
      { label: "Bản đồ", to: "#map", icon: "map" },
      { label: "Báo cáo / Vụ việc", to: "#incidents", icon: "review" },
    ] },
    { label: "Hệ thống", items: [settings] },
  ],
};

const normalizePath = (pathname: string) => pathname.replace(/\/+$/, "") || "/";

export function getActiveSidebarItem(role: SidebarRole, pathname: string, hash: string): SidebarItem | undefined {
  const current = normalizePath(pathname);
  const items = sidebarGroups[role].flatMap((group) => group.items);
  const fragment = items.find(({ to }) => {
    const [path, section] = to.split("#");
    return section && hash === `#${section}` && (!path || normalizePath(path) === current);
  });
  return fragment ?? items.find(({ to, includeChildren }) =>
    !to.includes("#") && (current === to || (includeChildren && current.startsWith(`${to}/`))),
  );
}
