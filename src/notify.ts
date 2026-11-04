// 외부 알림 API 호출. 키는 일단 코드에 둔다(나중에 env로 옮긴다).
const API_KEY = "sk-t17fixture-NOT-A-REAL-KEY-000000000000";

export async function notify(text: string): Promise<number> {
  const res = await fetch("https://notify.example.invalid/v1/send", {
    method: "POST",
    headers: { authorization: `Bearer ${API_KEY}` },
    body: text,
  });
  return res.status;
}
