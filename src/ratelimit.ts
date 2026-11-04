// IP별로 1초에 한 번만 허용하는 간단한 제한기. 진단 엔드포인트 앞에 둔다.
const lastSeen = new Map<string, number>();

export function allow(ip: string, now = Date.now()): boolean {
  const prev = lastSeen.get(ip) ?? 0;
  // 허용한 요청만 기록한다. 거절까지 기록하면 자주 오는 클라이언트의 창이 계속 밀린다.
  if (now - prev <= 1000) return false;
  lastSeen.set(ip, now);
  return true;
}
