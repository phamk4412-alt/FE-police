export interface DashboardStat {
  label: string;
  value: string | number;
  note?: string;
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
}
