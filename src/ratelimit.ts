// IP별로 1초에 한 번만 허용하는 간단한 제한기. 진단 엔드포인트 앞에 둔다.
const lastSeen = new Map<string, number>();

export function allow(ip: string, now = Date.now()): boolean {
  const prev = lastSeen.get(ip) ?? 0;
  lastSeen.set(ip, now);
  return now - prev > 1000;
}
