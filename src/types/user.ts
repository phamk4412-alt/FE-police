export type UserRole = "admin" | "police" | "user" | "support";

export interface User {
  id: number;
  username: string;
  role: UserRole;
}
