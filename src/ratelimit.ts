// IP별로 1초에 한 번만 허용하는 간단한 제한기. 진단 엔드포인트 앞에 둔다.
const lastSeen = new Map<string, number>();
// 오래된 기록을 지워 Map이 끝없이 자라지 않게 한다.
function sweep(now: number): void {
  for (const [ip, at] of lastSeen) if (now - at > 60_000) lastSeen.delete(ip);
}

export function allow(ip: string, now = Date.now()): boolean {
  sweep(now);
  const prev = lastSeen.get(ip) ?? 0;
  // 허용한 요청만 기록한다. 거절까지 기록하면 자주 오는 클라이언트의 창이 계속 밀린다.
  if (now - prev <= 1000) return false;
  lastSeen.set(ip, now);
  return true;
}
