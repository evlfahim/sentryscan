import { test, expect } from "vitest";
import { version } from "./index";

test("version", () => {
  expect(version).toBe("0.1.0");
});
