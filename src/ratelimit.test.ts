import { expect, test } from "bun:test";
import { allow } from "./ratelimit";

test("처음 요청은 허용하고 1초 안의 두 번째는 막는다", () => {
  expect(allow("10.0.0.1", 10_000)).toBe(true);
  expect(allow("10.0.0.1", 10_500)).toBe(false);
});
