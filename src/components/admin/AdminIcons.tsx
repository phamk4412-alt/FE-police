export type AdminIconName =
  | "activity"
  | "admin"
  | "alert"
  | "camera"
  | "check"
  | "chevronRight"
  | "chevronLeft"
  | "filter"
  | "edit"
  | "refresh"
  | "star"
  | "layers"
  | "plus"
  | "play"
  | "pause"
  | "stop"
  | "review"
  | "vehicle"
  | "tree"
  | "ambulance"
  | "bell"
  | "chart"
  | "clock"
  | "delete"
  | "file"
  | "flame"
  | "lock"
  | "mail"
  | "logout"
  | "map"
  | "menu"
  | "close"
  | "mapPin"
  | "image"
  | "phone"
  | "police"
  | "send"
  | "search"
  | "settings"
  | "shield"
  | "support"
  | "unlock"
  | "user"
  | "users"
  | "view"
  | "viewOff";

interface AdminIconProps {
  name:
    AdminIconName;
}

const paths: Record<AdminIconName, string> = {
  activity: "M4 13h4l2-6 4 12 2-6h4",
  admin: "M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z M9 11l2 2 4-4",
  alert: "M12 3l9 16H3l9-16z M12 9v4 M12 17h.01",
  camera: "M4 8h3l1.5-2h7L17 8h3v11H4z M12 10a3.5 3.5 0 100 7 3.5 3.5 0 000-7z",
  check: "M5 12l4 4L19 6",
  chevronRight: "M9 5l7 7-7 7",
  chevronLeft: "M15 5l-7 7 7 7",
  filter: "M4 5h16l-6 7v6l-4 2v-8z",
  edit: "M13 6l5 5M4 20l5-1L20 8l-5-5L4 14z",
  refresh: "M20 5v5h-5 M20 10a8 8 0 1 0 .7 5",
  star: "M12 3l2.8 5.8 6.4.9-4.6 4.5 1.1 6.3-5.7-3-5.7 3 1.1-6.3-4.6-4.5 6.4-.9z",
  layers: "M12 3l9 5-9 5-9-5z M3 12l9 5 9-5 M3 16l9 5 9-5",
  plus: "M12 5v14M5 12h14",
  play: "M8 5l12 7-12 7z",
  pause: "M9 5v14m6-14v14",
  stop: "M6 6h12v12H6z",
  review: "M9 5H5v16h14V5h-4 M9 3h6v5H9z M8 14l3 3 5-5",
  vehicle: "M5 17v2m14-2v2M4 12l2-6h12l2 6v5H4z M4 12h16 M7 15h1m8 0h1",
  tree: "M12 15v6 M12 3l6 7h-3l5 6H4l5-6H6z",
  ambulance: "M4 7h10v9H4z M14 10h3l3 3v3h-6z M7 19a2 2 0 100-4 2 2 0 000 4z M17 19a2 2 0 100-4 2 2 0 000 4z M8 9v4 M6 11h4",
  bell: "M17 16H7l1.2-2.2V10a3.8 3.8 0 017.6 0v3.8L17 16z M10 18h4",
  chart: "M5 19V9 M12 19V5 M19 19v-7",
  clock: "M12 5a7 7 0 100 14 7 7 0 000-14z M12 8v4l3 2",
  delete: "M6 7h12 M10 7V5h4v2 M8 9l1 10h6l1-10",
  file: "M7 3h7l4 4v14H7z M14 3v5h5 M9 13h6 M9 17h6",
  flame: "M12 21c-4 0-7-3-7-7 0-3 2-5 4-7 0 2 1 3 2 4 1-3 2-5 5-8 1 4 4 6 4 11 0 4-3 7-8 7z",
  lock: "M7 10h10v9H7z M9 10V8a3 3 0 116 0v2",
  mail: "M4 5h16v14H4z M4 7l8 6 8-6",
  logout: "M14 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4 M10 16l-4-4 4-4 M6 12h10",
  map: "M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z M9 4v14 M15 6v14",
  menu: "M4 7h16 M4 12h16 M4 17h16",
  close: "M6 6l12 12 M18 6L6 18",
  mapPin: "M12 21s7-5 7-11a7 7 0 10-14 0c0 6 7 11 7 11z M12 7a3 3 0 100 6 3 3 0 000-6z",
  image: "M4 5h16v14H4z M8 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z M4 16l5-5 3 3 2-2 6 6",
  phone: "M7 4l3 3-2 2c1 3 3 5 6 7l2-2 3 3-2 4c-7-1-13-7-14-14l4-3z",
  police: "M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z M8 12h8",
  send: "M21 3L10 14 M21 3l-7 18-4-7-7-4 18-7z",
  search: "M11 5a6 6 0 104.2 10.2L19 19 M15.2 15.2l-1.4-1.4",
  settings: "M12 8a4 4 0 100 8 4 4 0 000-8z M4 12h2 M18 12h2 M12 4v2 M12 18v2 M6.3 6.3l1.4 1.4 M16.3 16.3l1.4 1.4 M17.7 6.3l-1.4 1.4 M7.7 16.3l-1.4 1.4",
  shield: "M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z",
  support: "M5 12a7 7 0 0114 0v4a2 2 0 01-2 2h-2 M5 12v4a2 2 0 002 2h2 M9 19h6",
  unlock: "M7 10h10v9H7z M9 10V8a3 3 0 015.4-1.8",
  user: "M12 11a4 4 0 100-8 4 4 0 000 8z M5 20a7 7 0 0114 0",
  users: "M9 11a4 4 0 100-8 4 4 0 000 8z M3 20a6 6 0 0112 0 M16 11a3 3 0 100-6 M17 20a5 5 0 00-4-4.8",
  view: "M3 12s3.2-6 9-6 9 6 9 6-3.2 6-9 6-9-6-9-6z M12 9a3 3 0 100 6 3 3 0 000-6z",
  viewOff: "M3 3l18 18 M9 6.5a9.5 9.5 0 013-.5c5.8 0 9 6 9 6a16 16 0 01-2.5 3 M6 8.1A16 16 0 003 12s3.2 6 9 6a9 9 0 004-.9",
};

function AdminIcon({ name }: AdminIconProps) {
  return (
    <svg aria-hidden="true" className="admin-icon" viewBox="0 0 24 24">
      <path d={paths[name]} />
    </svg>
  );
}

export default AdminIcon;
