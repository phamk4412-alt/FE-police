import type { UserAccount } from "../../types/adminUser";
import AdminIcon from "./AdminIcons";

interface AccountStatsCardsProps {
  users: UserAccount[];
}

function AccountStatsCards({ users }: AccountStatsCardsProps) {
  const stats = [
    { icon: "users", label: "Tổng tài khoản", tone: "total", value: users.length },
    { icon: "admin", label: "Admin", tone: "admin", value: users.filter((user) => user.role === "admin").length },
    { icon: "police", label: "Cảnh sát", tone: "police", value: users.filter((user) => user.role === "police").length },
    { icon: "support", label: "Hỗ trợ", tone: "support", value: users.filter((user) => user.role === "support").length },
    { icon: "user", label: "Người dân", tone: "user", value: users.filter((user) => user.role === "user").length },
    {
      icon: "activity",
      label: "Đang hoạt động",
      tone: "active",
      value: users.filter((user) => user.status === "active").length,
    },
    {
      icon: "lock",
      label: "Bị khóa",
      tone: "locked",
      value: users.filter((user) => user.status === "locked").length,
    },
  ] as const;

  return (
    <section className="admin-stats-grid" aria-label="Thống kê nhanh tài khoản">
      {stats.map((stat) => (
        <article className={`admin-stat-card admin-tone-${stat.tone}`} key={stat.label}>
          <span className="admin-stat-icon">
            <AdminIcon name={stat.icon} />
          </span>
          <strong>{stat.value}</strong>
          <span>{stat.label}</span>
        </article>
      ))}
    </section>
  );
}

export default AccountStatsCards;
