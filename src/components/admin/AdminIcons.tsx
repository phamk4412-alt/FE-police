interface AdminIconProps {
  name:
    | "activity"
    | "admin"
    | "bell"
    | "chart"
    | "clock"
    | "delete"
    | "lock"
    | "police"
    | "search"
    | "settings"
    | "shield"
    | "support"
    | "unlock"
    | "user"
    | "users"
    | "view";
}

const paths: Record<AdminIconProps["name"], string> = {
  activity: "M4 13h4l2-6 4 12 2-6h4",
  admin: "M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z M9 11l2 2 4-4",
  bell: "M17 16H7l1.2-2.2V10a3.8 3.8 0 017.6 0v3.8L17 16z M10 18h4",
  chart: "M5 19V9 M12 19V5 M19 19v-7",
  clock: "M12 5a7 7 0 100 14 7 7 0 000-14z M12 8v4l3 2",
  delete: "M6 7h12 M10 7V5h4v2 M8 9l1 10h6l1-10",
  lock: "M7 10h10v9H7z M9 10V8a3 3 0 116 0v2",
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
