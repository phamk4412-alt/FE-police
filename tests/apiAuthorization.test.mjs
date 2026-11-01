import assert from "node:assert/strict";
import { test } from "node:test";

const baseUrl = process.env.ROLE_TEST_API_URL;
test("login and backend role authorization against a disposable in-memory server", { skip: !baseUrl }, async (t) => {
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(baseUrl).hostname), "Tests must only target localhost");
  const request = async (path, { token, body, method = "GET" } = {}) => {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: response.status, data };
  };
  const health = await request("/api/health");
  assert.equal(health.data.databaseProvider, "inmemory", "Never test against a persistent database");
  const password = "Role-flow-test-2026!";
  const register = async (role) => {
    const email = `role-test-${role}@example.invalid`;
    const result = await request("/api/auth/register", {
      method: "POST", body: { DisplayName: `Role test ${role}`, Email: email, Password: password, Role: "admin" },
    });
    assert.equal(result.status, 200);
    return { ...result.data, email };
  };
  const admin = await register("admin");
  assert.equal(admin.User.Role, "admin", "Use the explicitly configured test bootstrap admin");
  const accounts = { admin };
  for (const role of ["police", "support", "user"]) {
    const account = await register(role);
    assert.equal(account.User.Role, "user", "Registration cannot grant a client-supplied role");
    if (role !== "user") {
      const grant = await request(`/api/admin/accounts/${account.User.Id}/role`, {
        method: "PATCH", token: admin.Token, body: { Role: role },
      });
      assert.equal(grant.status, 200);
    }
    accounts[role] = account;
  }
  const routes = {
    admin: "/api/admin/accounts",
    police: "/api/police/cases",
    support: "/api/support/dispatch-board",
    user: "/api/user/report-history",
  };
  for (const [role, account] of Object.entries(accounts)) {
    await t.test(`${role}: password login, current role and cross-role access`, async () => {
      const login = await request("/api/auth/login", {
        method: "POST", body: { Email: account.email, Password: password },
      });
      assert.equal(login.status, 200);
      assert.equal(login.data.User.Role, role);
      account.Token = login.data.Token;
      const me = await request("/api/auth/me", { token: account.Token });
      assert.equal(me.status, 200);
      assert.equal(me.data.Role, role);
      for (const [requiredRole, path] of Object.entries(routes)) {
        const result = await request(path, { token: account.Token });
        assert.equal(result.status, role === requiredRole ? 200 : 403, `${role} -> ${path}`);
      }
      assert.equal((await request("/api/incidents", { token: account.Token })).status, 200, "Shared map reads remain available");
      assert.equal((await request("/api/auth/logout", { method: "POST", token: account.Token })).status, 200);
      const wrongPassword = await request("/api/auth/login", {
        method: "POST", body: { Email: account.email, Password: "wrong-password" },
      });
      assert.equal(wrongPassword.status, 401);
    });
  }
  await t.test("anonymous access and citizen privilege escalation are blocked", async () => {
    for (const path of [...Object.values(routes), "/api/incidents"]) {
      assert.equal((await request(path)).status, 401, path);
    }
    const token = accounts.user.Token;
    const id = accounts.user.User.Id;
    assert.equal((await request(`/api/admin/accounts/${id}/role`, { method: "PATCH", token, body: { Role: "police" } })).status, 403);
    assert.equal((await request("/api/police/me/location", { method: "POST", token, body: {} })).status, 403);
    assert.equal((await request("/api/support/news", { method: "POST", token, body: {} })).status, 403);
    assert.equal((await request(`/api/incidents/${id}/status`, { method: "PATCH", token, body: { Status: "resolved" } })).status, 403);
    assert.equal((await request("/hubs/incidents/negotiate?negotiateVersion=1", { method: "POST" })).status, 401);
  });
  await t.test("role changes and account locks apply to existing tokens", async () => {
    const temporary = await request("/api/auth/register", {
      method: "POST", body: { DisplayName: "Revocation test", Email: "role-test-revoked@example.invalid", Password: password },
    });
    assert.equal(temporary.status, 200);
    const token = temporary.data.Token;
    const id = temporary.data.User.Id;
    const update = (suffix, body) => request(`/api/admin/accounts/${id}/${suffix}`, { method: "PATCH", token: admin.Token, body });
    assert.equal((await update("role", { Role: "police" })).status, 200);
    assert.equal((await request(routes.police, { token })).status, 200);
    assert.equal((await update("role", { Role: "user" })).status, 200);
    assert.equal((await request(routes.police, { token })).status, 403);
    assert.equal((await update("status", { Status: "locked" })).status, 200);
    assert.equal((await request("/api/auth/me", { token })).status, 401);
  });
});
