import { afterEach, expect, test } from "bun:test";
import { handle } from "./server";

const saved = { DATABASE_URL: process.env.DATABASE_URL, VALKEY_URL: process.env.VALKEY_URL };
afterEach(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

test("/healthz는 200 ok", async () => {
  const res = await handle(new Request("http://app/healthz"));
  expect(res.status).toBe(200);
  expect(await res.text()).toBe("ok");
});

test("연결 env가 없으면 503", async () => {
  delete process.env.DATABASE_URL;
  delete process.env.VALKEY_URL;
  expect((await handle(new Request("http://app/healthz/db"))).status).toBe(503);
  expect((await handle(new Request("http://app/healthz/cache"))).status).toBe(503);
});

// 닫힌 포트로 접속 실패를 만든다. 응답 본문에 연결 문자열의 비밀번호가 나오지 않아야 한다.
test("접속 실패는 503이고 비밀번호를 내보내지 않는다", async () => {
  process.env.DATABASE_URL = "postgresql://u:pw-should-not-leak@127.0.0.1:1/db?sslmode=disable";
  process.env.VALKEY_URL = "redis://default:pw-should-not-leak@127.0.0.1:1/0";
  for (const path of ["/healthz/db", "/healthz/cache"]) {
    const res = await handle(new Request(`http://app${path}`));
    expect(res.status).toBe(503);
    expect(await res.text()).not.toContain("pw-should-not-leak");
  }
});
