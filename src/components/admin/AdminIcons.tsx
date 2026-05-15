export type AdminIconName =
  | "activity"
  | "admin"
  | "alert"
  | "ambulance"
  | "bell"
  | "chart"
  | "clock"
  | "delete"
  | "file"
  | "flame"
  | "lock"
  | "mapPin"
  | "phone"
  | "police"
  | "search"
  | "settings"
  | "shield"
  | "support"
  | "unlock"
  | "user"
  | "users"
  | "view";

interface AdminIconProps {
  name:
    AdminIconName;
}

const paths: Record<AdminIconName, string> = {
  activity: "M4 13h4l2-6 4 12 2-6h4",
  admin: "M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z M9 11l2 2 4-4",
  alert: "M12 3l9 16H3l9-16z M12 9v4 M12 17h.01",
  ambulance: "M4 7h10v9H4z M14 10h3l3 3v3h-6z M7 19a2 2 0 100-4 2 2 0 000 4z M17 19a2 2 0 100-4 2 2 0 000 4z M8 9v4 M6 11h4",
  bell: "M17 16H7l1.2-2.2V10a3.8 3.8 0 017.6 0v3.8L17 16z M10 18h4",
  chart: "M5 19V9 M12 19V5 M19 19v-7",
  clock: "M12 5a7 7 0 100 14 7 7 0 000-14z M12 8v4l3 2",
  delete: "M6 7h12 M10 7V5h4v2 M8 9l1 10h6l1-10",
  file: "M7 3h7l4 4v14H7z M14 3v5h5 M9 13h6 M9 17h6",
  flame: "M12 21c-4 0-7-3-7-7 0-3 2-5 4-7 0 2 1 3 2 4 1-3 2-5 5-8 1 4 4 6 4 11 0 4-3 7-8 7z",
  lock: "M7 10h10v9H7z M9 10V8a3 3 0 116 0v2",
  mapPin: "M12 21s7-5 7-11a7 7 0 10-14 0c0 6 7 11 7 11z M12 7a3 3 0 100 6 3 3 0 000-6z",
  phone: "M7 4l3 3-2 2c1 3 3 5 6 7l2-2 3 3-2 4c-7-1-13-7-14-14l4-3z",
  police: "M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z M8 12h8",
  search: "M11 5a6 6 0 104.2 10.2L19 19 M15.2 15.2l-1.4-1.4",
  settings: "M12 8a4 4 0 100 8 4 4 0 000-8z M4 12h2 M18 12h2 M12 4v2 M12 18v2 M6.3 6.3l1.4 1.4 M16.3 16.3l1.4 1.4 M17.7 6.3l-1.4 1.4 M7.7 16.3l-1.4 1.4",
  shield: "M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z",
  support: "M5 12a7 7 0 0114 0v4a2 2 0 01-2 2h-2 M5 12v4a2 2 0 002 2h2 M9 19h6",
  unlock: "M7 10h10v9H7z M9 10V8a3 3 0 015.4-1.8",
  user: "M12 11a4 4 0 100-8 4 4 0 000 8z M5 20a7 7 0 0114 0",
  users: "M9 11a4 4 0 100-8 4 4 0 000 8z M3 20a6 6 0 0112 0 M16 11a3 3 0 100-6 M17 20a5 5 0 00-4-4.8",
  view: "M3 12s3.2-6 9-6 9 6 9 6-3.2 6-9 6-9-6-9-6z M12 9a3 3 0 100 6 3 3 0 000-6z",
};

function AdminIcon({ name }: AdminIconProps) {
  return (
    <svg aria-hidden="true" className="admin-icon" viewBox="0 0 24 24">
      <path d={paths[name]} />
    </svg>
  );
}

export default AdminIcon;
