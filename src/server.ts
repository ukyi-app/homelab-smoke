// 최소 서버. /healthz는 공유 차트(web)의 기본 readiness probe 경로다.
// 포트는 차트가 env PORT로 넣는다(값은 homelab apps/<앱>/values.yaml의 port, 1024 이상).
// /healthz/db·/healthz/cache는 homelab 시험(설계 E6 시나리오 2·3·8)이 port-forward로 부른다. readiness에는 쓰지 않는다.
// 연결 정보는 차트가 env DATABASE_URL·VALKEY_URL로 넣는다(uses.postgres·uses.valkey). 없으면 503.
import { RedisClient, SQL } from "bun";

// 부를 때마다 새로 접속한다. 풀에 남은 연결은 비밀번호를 바꾼 뒤에도 살아 있어 회전 확인(시나리오 8)을 속인다.
const TIMEOUT_MS = 3000;

function withTimeout<T>(p: Promise<T>): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)),
  ]);
}

// 오류 본문에는 이름만 남긴다. 연결 문자열(비밀번호 포함)이 응답·로그로 나가지 않게.
function fail(what: string, err: unknown): Response {
  const name = err instanceof Error ? ((err as { code?: string }).code ?? err.name) : "unknown";
  console.error(`${what} check failed: ${name}`);
  return new Response(`${what} error`, { status: 503 });
}

async function checkDb(): Promise<Response> {
  const url = process.env.DATABASE_URL;
  if (!url) return new Response("no DATABASE_URL", { status: 503 });
  const db = new SQL(url, { max: 1, connectionTimeout: TIMEOUT_MS / 1000 });
  try {
    await withTimeout(db`select 1`);
    return new Response("ok");
  } catch (err) {
    return fail("db", err);
  } finally {
    db.close().catch(() => {});
  }
}

async function checkCache(): Promise<Response> {
  const url = process.env.VALKEY_URL;
  if (!url) return new Response("no VALKEY_URL", { status: 503 });
  const kv = new RedisClient(url, { autoReconnect: false, connectionTimeout: TIMEOUT_MS });
  try {
    await withTimeout(kv.ping());
    return new Response("ok");
  } catch (err) {
    return fail("cache", err);
  } finally {
    kv.close();
  }
}

export async function handle(req: Request): Promise<Response> {
  const { pathname } = new URL(req.url);
  if (pathname === "/healthz") return new Response("ok");
  if (pathname === "/healthz/db") return checkDb();
  if (pathname === "/healthz/cache") return checkCache();
  return new Response("hello");
}

if (import.meta.main) {
  const port = Number(process.env.PORT ?? 8080);
  const server = Bun.serve({ port, fetch: handle });
  console.log(`listening on :${port}`);
  // 컨테이너의 PID 1은 기본 처리기가 없어 SIGTERM을 무시한다. 없으면 배포·재시작마다 유예 시간(30초)을 다 기다린다.
  process.on("SIGTERM", async () => {
    await server.stop();
    process.exit(0);
  });
}
