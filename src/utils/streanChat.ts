export type ChatSource = {
  title?: string;
  video_url?: string;
  label?: string;
  doc_id?: string;
  snippet?: string;
};

export async function streamChat(
  body: any,
  onDelta: (text: string) => void,
  onSources?: (s: ChatSource[]) => void,
  signal?: AbortSignal
) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE는 \n\n 로 프레임 끝남
    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 2);

      // event 라인(옵션)
      const isSources = frame.startsWith("event: sources");
      const isDone = frame.startsWith("event: done");
      const dataLine = frame.split("\n").find((l) => l.startsWith("data:"));

      if (isSources && dataLine && onSources) {
        try {
          const payload = JSON.parse(dataLine.replace(/^data:\s*/, ""));
          onSources(payload.sources || []);
        } catch {
          /* noop */
        }
        continue;
      }

      if (isDone) return;

      if (dataLine) {
        const raw = dataLine.replace(/^data:\s*/, "");
        // RunPod 워커가 {"delta":"..."} 또는 {"output": "..."}나 plain text를 줄 수 있음
        try {
          const obj = JSON.parse(raw);
          const delta = obj.delta ?? obj.output ?? obj.text ?? "";
          if (delta) onDelta(delta);
        } catch {
          onDelta(raw);
        }
      }
    }
  }
}
