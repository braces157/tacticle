import { readJson, removeStored, writeJson } from "../services/browserStorage";

test("browser storage helpers round-trip data across local and session storage", () => {
  expect(readJson("missing-local", { ok: false })).toEqual({ ok: false });
  expect(readJson("missing-session", "fallback", "sessionStorage")).toBe("fallback");

  writeJson("local-key", { ok: true });
  writeJson("session-key", "/orders/TG-2048", "sessionStorage");

  expect(readJson("local-key", { ok: false })).toEqual({ ok: true });
  expect(readJson("session-key", "fallback", "sessionStorage")).toBe("/orders/TG-2048");

  removeStored("local-key");
  removeStored("session-key", "sessionStorage");

  expect(readJson("local-key", null)).toBeNull();
  expect(readJson("session-key", null, "sessionStorage")).toBeNull();
});
