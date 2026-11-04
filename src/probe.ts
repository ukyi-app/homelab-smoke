// 시험 도구가 내려받는 고정 바이너리 표식. 크기만 돌려준다.
import { readFileSync } from "node:fs";

export function probeSize(): number {
  return readFileSync(new URL("../assets/probe.bin", import.meta.url)).byteLength;
}
