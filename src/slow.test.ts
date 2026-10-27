import { existsSync } from "node:fs";
import { test } from "bun:test";

// homelab 설계 G 시나리오 11(빌드 순서 역전) 시험용. 표시 파일 .slow-build가 있으면 이미지 빌드의 test 단계를 150초 늦춘다.
// 표시 파일이 없으면 바로 끝난다.
test("slow build marker", async () => {
  if (existsSync(".slow-build")) await Bun.sleep(150_000);
}, 200_000);
