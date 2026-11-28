import assert from "node:assert/strict";
import { test } from "node:test";
import { setTimeout as wait } from "node:timers/promises";

const baseUrl = process.env.POLICE_ONLINE_TEST_API_URL;

test("online police presence against a disposable in-memory backend", { skip: !baseUrl, timeout: 100_000 }, async (t) => {
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(baseUrl).hostname));
  const password = "Presence-test-only-2026!";
  const endpoint = "/api/support/police/online";

  async function request(route, { token, body, method = "GET" } = {}) {
    const response = await fetch(baseUrl + route, {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    return { status: response.status, data: text && response.headers.get("content-type")?.includes("json") ? JSON.parse(text) : text };
  }

  assert.equal((await request("/api/health")).data.databaseProvider, "inmemory");
  async function register(name) {
    const email = `presence-${name}@example.invalid`;
    const result = await request("/api/auth/register", {
      method: "POST", body: { DisplayName: name, Email: email, Password: password },
    });
    assert.equal(result.status, 200, name);
    return { email, id: result.data.User.Id, token: result.data.Token, role: result.data.User.Role };
  }
  async function login(account) {
    const result = await request("/api/auth/login", {
      method: "POST", body: { Email: account.email, Password: password },
    });
    assert.equal(result.status, 200, account.email);
    return result.data.Token;
  }

  const admin = await register("admin");
  assert.equal(admin.role, "admin", "Configure the explicitly named test bootstrap account.");
  const support = await register("support");
  const citizen = await register("citizen");
  const first = await register("first");
  const second = await register("second");
  for (const [account, role] of [[support, "support"], [first, "police"], [second, "police"]]) {
    assert.equal((await request(`/api/admin/accounts/${account.id}/role`, {
      method: "PATCH", token: admin.token, body: { Role: role },
    })).status, 200);
  }

  const supportToken = await login(support);
  async function expectOnline(...accounts) {
    const result = await request(endpoint, { token: supportToken });
    assert.equal(result.status, 200);
    assert.deepEqual(result.data.map((account) => account.AccountId).sort(), accounts.map((account) => account.id).sort());
    assert.ok(result.data.every((account) => account.DisplayName && Number.isFinite(Date.parse(account.OnlineSince))));
    return result.data;
  }
  const heartbeat = (token) => request("/api/police/online/heartbeat", { method: "POST", token });
  const logout = (token) => request("/api/auth/logout", { method: "POST", token });

  await t.test("no live Police, access is restricted to the matching roles", async () => {
    await expectOnline();
    assert.equal((await request(endpoint)).status, 401);
    assert.equal((await heartbeat()).status, 401);
    for (const token of [await login(citizen), supportToken, await login(admin)]) {
      assert.equal((await heartbeat(token)).status, 403);
      if (token !== supportToken) assert.equal((await request(endpoint, { token })).status, 403);
    }
    const citizenPoliceView = await request("/api/auth/select-role", {
      method: "POST", token: citizen.token, body: { Role: "police" },
    });
    assert.equal(citizenPoliceView.status, 200, "The existing demo role selection remains available.");
    await expectOnline(citizen);
    assert.equal((await heartbeat(citizenPoliceView.data.Token)).status, 204);
    await logout(citizenPoliceView.data.Token);
    await expectOnline();
  });

  let firstToken;
  await t.test("two Police accounts, shared tabs and independent sessions, logout and role switch", async () => {
    firstToken = await login(first);
    const initial = await expectOnline(first);
    assert.equal((await request(endpoint, { token: firstToken })).status, 403);
    const secondToken = await login(second);
    await expectOnline(first, second);
    for (const response of await Promise.all([heartbeat(firstToken), heartbeat(firstToken)])) {
      assert.equal(response.status, 204);
    }
    const anotherFirstToken = await login(first);
    assert.notEqual(anotherFirstToken, firstToken);
    assert.equal((await expectOnline(first, second)).find((account) => account.AccountId === first.id).OnlineSince, initial[0].OnlineSince);
    assert.equal((await logout(anotherFirstToken)).status, 200);
    assert.equal((await heartbeat(anotherFirstToken)).status, 401);
    await expectOnline(first, second);
    const switchResult = await request("/api/auth/select-role", {
      method: "POST", token: secondToken, body: { Role: "support" },
    });
    assert.equal(switchResult.status, 200);
    assert.equal((await heartbeat(secondToken)).status, 401);
    assert.equal((await heartbeat(switchResult.data.Token)).status, 403);
    await expectOnline(first);
    const secondNewSession = await login(second);
    await expectOnline(first, second);
    assert.equal((await logout(secondNewSession)).status, 200);
    await expectOnline(first);
  });

  await t.test("silent disconnect expires, reconnect creates a fresh online period", async () => {
    assert.equal((await heartbeat(firstToken)).status, 204);
    const before = await expectOnline(first);
    await wait(76_000);
    await expectOnline();
    assert.equal((await heartbeat(firstToken)).status, 204);
    assert.ok(Date.parse((await expectOnline(first))[0].OnlineSince) > Date.parse(before[0].OnlineSince));
    await logout(firstToken);
    await expectOnline();
  });
});
