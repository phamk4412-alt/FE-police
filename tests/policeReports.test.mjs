import assert from "node:assert/strict";
import { test } from "node:test";

const baseUrl = process.env.ROLE_TEST_API_URL;
test("Police reports: create, read back, filterable statuses and authorization", { skip: !baseUrl }, async () => {
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(baseUrl).hostname));
  assert.equal((await (await fetch(`${baseUrl}/api/health`)).json()).databaseProvider, "inmemory");
  const registration = await fetch(`${baseUrl}/api/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ DisplayName: "Cảnh sát kiểm thử", Email: "police-ui-tester@example.invalid", Password: "Police-ui-test-2026!" }) });
  assert.equal(registration.status, 200);
  const account = await registration.json();
  const selection = await fetch(`${baseUrl}/api/auth/select-role`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${account.Token}` }, body: JSON.stringify({ Role: "police" }) });
  assert.equal(selection.status, 200);
  const { Token: token } = await selection.json();
  const create = (title, latitude = "10.7769", bearer = token) => {
    const data = new FormData();
    data.set("Title", title); data.set("Detail", "Dữ liệu kiểm thử giao diện, database tạm trong bộ nhớ.");
    data.set("Category", "An ninh trật tự"); data.set("Latitude", latitude); data.set("Longitude", "106.7009");
    data.append("Images", new Blob([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64")], { type: "image/png" }), "police-test.png");
    return fetch(`${baseUrl}/api/police/reports`, { method: "POST", headers: bearer ? { Authorization: `Bearer ${bearer}` } : {}, body: data });
  };
  const fixtures = [
    ["Va chạm giữa ô tô và xe máy", "new"], ["Tụ tập gây mất trật tự công cộng", "processing"],
    ["Mất tài sản tại cửa hàng tiện lợi", "processing"], ["Hỗ trợ tìm người thân đi lạc", "done"], ["Va chạm nhẹ tại vòng xoay", "done"],
  ];
  for (const [title, status] of fixtures) {
    const response = await create(title);
    assert.equal(response.status, 200);
    const { Incident: incident } = await response.json();
    assert.equal(incident.Title, title);
    assert.equal(incident.Source, "police");
    assert.equal(incident.ImageUrls.length, 1);
    const readback = await (await fetch(`${baseUrl}/api/incidents/${incident.Id}`, { headers: { Authorization: `Bearer ${token}` } })).json();
    assert.equal(readback.Title, title);
    assert.equal(readback.ImageUrls.length, 1);
    assert.equal((await fetch(`${baseUrl}${readback.ImageUrls[0]}`)).status, 200);
    if (status !== "new") {
      const update = await fetch(`${baseUrl}/api/police/cases/${incident.Id}/status`, { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ Status: status }) });
      assert.equal(update.status, 200);
    }
  }
  assert.equal((await create("Ngoài khu vực", "0")).status, 400);
  assert.equal((await create("Không đăng nhập", "10.7769", null)).status, 401);
  assert.equal((await create("Sai vai trò", "10.7769", account.Token)).status, 403);
  const list = await (await fetch(`${baseUrl}/api/police/cases`, { headers: { Authorization: `Bearer ${token}` } })).json();
  assert.equal(list.filter((item) => item.ReporterName === "Cảnh sát kiểm thử").length, 5);
});
