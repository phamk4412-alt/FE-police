import assert from "node:assert/strict";
import { test } from "node:test";
import { getStatusGroup, isInPolicePeriod, matchesPoliceSearch, formatPoliceTime } from "../src/pages/dashboards/police/policeUtils.ts";

test("groups actual backend ASCII statuses and Vietnamese status labels", () => {
  for (const status of ["Moi tiep nhan", "Mới tiếp nhận", "new"]) assert.equal(getStatusGroup(status), "new");
  for (const status of ["Da tiep nhan", "Dang xac minh", "Da dieu phoi", "Đang xử lý"]) assert.equal(getStatusGroup(status), "processing");
  for (const status of ["Da xu ly", "Đã xử lý", "Hoàn thành", "resolved"]) assert.equal(getStatusGroup(status), "completed");
});
test("search supports Vietnamese without accents and incident identifiers", () => {
  assert.equal(matchesPoliceSearch("duong", ["Đường Nguyễn Thị Minh Khai"]), true);
  assert.equal(matchesPoliceSearch("A1B2", ["a1b2-uuid", "Tai nạn"]), true);
  assert.equal(matchesPoliceSearch("không có", ["Tai nạn"]), false);
});
test("week and month filters use Vietnam calendar boundaries", () => {
  const now = new Date("2026-11-02T01:00:00+07:00");
  assert.equal(isInPolicePeriod("2026-11-01T23:59:59+07:00", "week", now), false);
  assert.equal(isInPolicePeriod("2026-11-02T00:00:00+07:00", "week", now), true);
  assert.equal(isInPolicePeriod("2026-10-31T23:59:59+07:00", "month", now), false);
  assert.equal(isInPolicePeriod("2026-11-01T00:00:00+07:00", "month", now), true);
  assert.equal(isInPolicePeriod("2026-11-03T00:00:00+07:00", "month", now), false);
  assert.equal(isInPolicePeriod("invalid", "week", now), false);
});
test("missing timestamps do not render Invalid Date", () => { assert.equal(formatPoliceTime(""), "Chưa ghi nhận"); });
