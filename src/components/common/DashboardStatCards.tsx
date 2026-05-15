import AdminIcon, { type AdminIconName } from "../admin/AdminIcons";

export interface DashboardStatCardItem {
  icon: AdminIconName;
  label: string;
  note: string;
  tone: "blue" | "green" | "orange" | "purple" | "red" | "yellow";
  value: number | string;
}

interface DashboardStatCardsProps {
  ariaLabel: string;
  stats: DashboardStatCardItem[];
}

function DashboardStatCards({ ariaLabel, stats }: DashboardStatCardsProps) {
  return (
    <section className="stats-grid dashboard-stats-grid" aria-label={ariaLabel}>
      {stats.map((stat) => (
        <article className={`stat-card dashboard-stat-card stat-tone-${stat.tone}`} key={stat.label}>
          <span className="stat-icon">
            <AdminIcon name={stat.icon} />
          </span>
          <strong>{stat.value}</strong>
          <span>{stat.label}</span>
          <small>{stat.note}</small>
        </article>
      ))}
    </section>
  );
}

export default DashboardStatCards;
