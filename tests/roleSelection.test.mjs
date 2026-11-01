import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { clearSelectedRole, isUserRole, readSelectedRole, saveSelectedRole } from "../src/auth/roleSelection.ts";

let storage;
beforeEach(() => {
  storage = new Map();
  globalThis.window = { localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  } };
});

for (const role of ["admin", "police", "support", "user"]) {
  test(`restores the granted ${role} role after reload`, () => {
    saveSelectedRole("account-1", role);
    assert.equal(readSelectedRole("account-1", [role]), role);
  });
}

test("does not restore a different account's selection", () => {
  saveSelectedRole("account-1", "police");
  assert.equal(readSelectedRole("account-2", ["police"]), null);
  assert.equal(storage.size, 0);
});

test("rejects a forged or revoked privileged role", () => {
  for (const role of ["admin", "police", "support"]) {
    saveSelectedRole("account-1", role);
    assert.equal(readSelectedRole("account-1", ["user"]), null);
  }
});

test("only restores a role in the granted list, including multiple grants", () => {
  saveSelectedRole("account-1", "support");
  assert.equal(readSelectedRole("account-1", ["police", "support"]), "support");
  assert.equal(readSelectedRole("account-1", []), null);
});

test("rejects corrupt storage and unknown roles without defaulting to citizen", () => {
  storage.set("police.selectedRole", "broken json");
  assert.equal(readSelectedRole("account-1", ["user"]), null);
  for (const value of [null, "citizen", "owner", "Admin", {}, 1]) {
    assert.equal(isUserRole(value), false);
  }
});

test("logout clears the selected role", () => {
  saveSelectedRole("account-1", "police");
  clearSelectedRole();
  assert.equal(readSelectedRole("account-1", ["police"]), null);
});

test("unavailable browser storage does not crash routing", () => {
  window.localStorage = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
    removeItem() { throw new Error("blocked"); },
  };
  assert.doesNotThrow(() => saveSelectedRole("account-1", "user"));
  assert.equal(readSelectedRole("account-1", ["user"]), null);
  assert.doesNotThrow(clearSelectedRole);
});
