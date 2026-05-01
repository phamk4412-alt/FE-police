import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import type { UserRole } from "../types/user";
import { APP_NAME, ROLE_HOME_PATHS, ROLE_LABELS } from "../utils/constants";
import { setCurrentUser } from "../utils/storage";

const demoUsers: Array<{ id: number; username: string; role: UserRole }> = [
  { id: 1, username: "admin", role: "admin" },
  { id: 2, username: "police.officer", role: "police" },
  { id: 3, username: "citizen.user", role: "user" },
  { id: 4, username: "support.team", role: "support" },
];

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [role, setRole] = useState<UserRole>("admin");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const selectedUser =
      demoUsers.find((item) => item.role === role) ?? demoUsers[0];

    setCurrentUser({
      ...selectedUser,
      username: username.trim() || selectedUser.username,
    });

    navigate(ROLE_HOME_PATHS[role], { replace: true });
  }

  return (
    <main className="login-page">
      <section className="login-hero">
        <p className="eyebrow">Police Project</p>
        <h1>{APP_NAME}</h1>
        <p>
          Frontend starter for account management, incident monitoring,
          dispatch coordination, and citizen reports.
        </p>
      </section>

      <section className="login-card">
        <div className="section-heading">
          <span className="eyebrow">Login</span>
          <h2>Sign in to dashboard</h2>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <Input
            label="Username or email"
            name="username"
            onChange={(event) => setUsername(event.target.value)}
            placeholder="admin"
            value={username}
          />
          <Input
            label="Password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
            type="password"
            value={password}
          />

          <label className="field" htmlFor="role">
            <span>Mock role</span>
            <select
              id="role"
              onChange={(event) => setRole(event.target.value as UserRole)}
              value={role}
            >
              {demoUsers.map((user) => (
                <option key={user.role} value={user.role}>
                  {ROLE_LABELS[user.role]}
                </option>
              ))}
            </select>
          </label>

          <Button type="submit">Login</Button>
        </form>
      </section>
    </main>
  );
}

export default Login;
