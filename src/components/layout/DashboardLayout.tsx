import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import VietnameseDecor, { type VietnameseDecorVariant } from "../common/VietnameseDecor";
import AnimatedDashboardDecor from "../common/AnimatedDashboardDecor";
import type { UserRole } from "../../types/user";
import type { SupportTab } from "../../utils/constants";
import Header from "./Header";
import Sidebar from "./Sidebar";

const defaultDecorByRole: Record<Exclude<UserRole, "support" | "police">, VietnameseDecorVariant> = {
  admin: "admin",
  user: "user-home",
};

interface DashboardLayoutProps {
  activeSupportTab?: SupportTab;
  activeUserTab?: "home" | "map" | "news";
  children: ReactNode;
  decorVariant?: VietnameseDecorVariant;
  onSupportTabChange?: (tab: SupportTab) => void;
  onUserTabChange?: (tab: "home" | "map" | "news") => void;
  role: UserRole;
}

function DashboardLayout({
  activeSupportTab,
  activeUserTab,
  children,
  decorVariant,
  onSupportTabChange,
  onUserTabChange,
  role,
}: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const menuTriggerRef = useRef<HTMLElement | null>(null);
  const location = useLocation();
  const groupedSidebar = role !== "admin";

  useEffect(() => {
    if (!groupedSidebar || (location.hash !== "#map" && location.hash !== "#incidents")) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [groupedSidebar, location.hash, location.key]);

  useEffect(() => {
    if (!isMobileNavOpen) {
      return;
    }

    const drawer = groupedSidebar ? drawerRef.current : null;
    const trigger = menuTriggerRef.current;
    const mobile = window.matchMedia("(max-width: 980px)");
    const focusable = () => Array.from(drawer?.querySelectorAll<HTMLElement>(
      'a[href], button:not(:disabled), [tabindex="0"]',
    ) ?? []).filter((element) => element.getClientRects().length > 0);

    drawer?.querySelector<HTMLElement>(".role-sidebar-close")?.focus({ preventScroll: true });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMobileNavOpen(false);
      }
      if (event.key !== "Tab" || !drawer) return;
      const items = focusable();
      const first = items[0];
      const last = items.at(-1);
      const active = document.activeElement;
      if (!drawer.contains(active) || (event.shiftKey ? active === first : active === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      }
    }

    function handleResize(event: MediaQueryListEvent) {
      if (!event.matches) setIsMobileNavOpen(false);
    }

    document.body.classList.add("is-nav-locked");
    window.addEventListener("keydown", handleKeyDown);
    if (drawer) mobile.addEventListener("change", handleResize);

    return () => {
      document.body.classList.remove("is-nav-locked");
      window.removeEventListener("keydown", handleKeyDown);
      if (drawer) {
        mobile.removeEventListener("change", handleResize);
        if (mobile.matches && trigger?.isConnected) trigger.focus({ preventScroll: true });
      }
    };
  }, [groupedSidebar, isMobileNavOpen]);

  return (
    <div
      className={`dashboard-shell ${groupedSidebar ? "has-role-sidebar" : ""} ${role === "support" || role === "police" ? `is-${role}` : ""} ${isSidebarCollapsed ? "is-sidebar-collapsed" : ""} ${
        isMobileNavOpen ? "is-mobile-nav-open" : ""
      }`}
    >
      <Sidebar
        drawerRef={drawerRef}
        isCollapsed={isSidebarCollapsed}
        onNavigate={() => setIsMobileNavOpen(false)}
        onToggle={() => setIsSidebarCollapsed((current) => !current)}
        role={role}
      />
      <button
        aria-hidden={!isMobileNavOpen}
        aria-label="Đóng menu"
        className="sidebar-backdrop"
        tabIndex={isMobileNavOpen && !groupedSidebar ? 0 : -1}
        type="button"
        onClick={() => setIsMobileNavOpen(false)}
      />
      <div className="dashboard-main" inert={groupedSidebar && isMobileNavOpen}>
        {role === "support" || role === "police"
          ? <AnimatedDashboardDecor />
          : <VietnameseDecor variant={decorVariant || defaultDecorByRole[role]} />}
        <Header
          activeSupportTab={activeSupportTab}
          activeUserTab={activeUserTab}
          isMobileNavOpen={isMobileNavOpen}
          onMenuClick={() => {
            if (document.activeElement instanceof HTMLElement) menuTriggerRef.current = document.activeElement;
            setIsMobileNavOpen((current) => !current);
          }}
          onSupportTabChange={onSupportTabChange}
          onUserTabChange={onUserTabChange}
          role={role}
        />
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
