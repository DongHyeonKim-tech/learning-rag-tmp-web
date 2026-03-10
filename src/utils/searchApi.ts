import {
  SearchParams,
  SearchResponse,
  SearchParamsOpenAI,
  SearchResponseOpenAI,
  SearchSource,
  SearchParamsFramework,
  SearchResponseFramework,
  SearchLearningStreamCallbacks,
  GetMessagesParams,
  CreateChatRoomResponse,
  InsertUserMessageResponse,
  StreamEvent,
  StreamMetaData,
  StreamDoneData,
  StreamErrorData,
  ChatStreamOptions,
  ChatRoomData,
  Turn,
} from "@/app/Interface";
import camelcaseKeys from "camelcase-keys";
import { client } from "@/utils/client";

export async function searchDocumentsKure(
  params: SearchParams
): Promise<SearchResponse> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/search-kure`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    }
  );

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }

  return response.json();
}

export async function searchDocumentsOpenAI(
  params: SearchParamsOpenAI
): Promise<SearchResponseOpenAI> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/summarize`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    }
  );

  if (!response.ok) {
    let errorMessage = `Search failed: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage += ` - ${JSON.stringify(errorData)}`;
    } catch {
      // JSON 파싱 실패 시 기본 메시지 사용
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function searchLearningOpenAIStream(
  params: SearchParamsOpenAI,
  callbacks: SearchLearningStreamCallbacks
): Promise<SearchResponseOpenAI> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/learning`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: params.query,
      model: params.model ?? "json",
      top_k: params.top_k,
      use_context: params.use_context,
      temperature: params.temperature,
      filters: params.filters,
      chat_id: params.chat_id,
      embedding_model: params.embedding_model,
      emp_no: params.emp_no,
    }),
  });

  if (!res.ok) {
    let errorMessage = `Search failed: ${res.status}`;
    try {
      const errorData = await res.json();
      errorMessage += ` - ${JSON.stringify(errorData)}`;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  if (res.status === 204) {
    return {
      query: params.query,
      summary: "",
      sources: [],
      total_sources: 0,
      noContent: true,
    };
  }

  const stream = res.body;
  if (!stream) throw new Error("Stream not supported");
  console.log("stream: ", stream);

  // done 이벤트 받을 때까지 기다렸다가 결과를 반환하기 위한 Promise
  return await new Promise<SearchResponseOpenAI>((resolve, reject) => {
    let finalResult: SearchResponseOpenAI | null = null;
    let settled = false;

    const safeResolve = (v: SearchResponseOpenAI) => {
      if (settled) return;
      settled = true;
      resolve(v);
    };

    const safeReject = (e: unknown) => {
      if (settled) return;
      settled = true;
      reject(e);
    };

    parseSSEStream(
      stream,
      (evt) => {
        if (evt.type === "delta") {
          const text =
            (evt.data as any)?.text ??
            (evt.data as any)?.delta ??
            (evt.data as any)?.content;
          if (typeof text === "string" && text.length > 0) {
            callbacks.onDelta(text);
          }
          return;
        }

        if (evt.type === "meta") {
          callbacks.onMeta?.(evt.data as StreamMetaData);
          return;
        }

        if (evt.type === "done") {
          const doneData = evt.data as StreamDoneData;
          const chatId = doneData?.chat_id ?? null;
          const userMessageId = doneData?.user_message_id ?? null;
          const assistantMessageId = doneData?.assistant_message_id ?? null;
          const searchId = doneData?.search_id ?? null;
          const summaryText =
            (doneData as any)?.text ??
            (doneData as any)?.summary ??
            (doneData as any)?.content ??
            "";

          // 서버가 done에 sources/text를 주는 형태면 여기서 매핑
          finalResult = {
            query: params.query,
            summary: summaryText,
            sources: (doneData as any)?.sources ?? [],
            total_sources: ((doneData as any)?.sources?.length ?? 0) as number,
            chat_id: chatId,
            user_message_id: userMessageId,
            assistant_message_id: assistantMessageId,
            search_id: searchId,
          };

          safeResolve(finalResult);
          return;
        }

        if (evt.type === "error") {
          callbacks.onError?.(evt.data as StreamErrorData);
          safeReject(evt.data);
          return;
        }
      },
      { bufferDeltaUntilMeta: false }
    )
      .then(() => {
        // 스트림이 끝났는데 done을 못 받았을 때 fallback
        if (!settled) {
          safeResolve(
            finalResult ?? {
              query: params.query,
              summary: "",
              sources: [],
              total_sources: 0,
            }
          );
        }
      })
      .catch((e) => {
        safeReject(e);
      });
  });
}

export async function searchDocuments(
  params: SearchParams
): Promise<SearchResponse> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }

  return response.json();
}

export async function searchFrameworkDocuments(
  params: SearchParamsFramework
): Promise<SearchResponseFramework> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_FRAMEWORK_API_BASE}/framework`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    }
  );

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }

  return response.json();
}

export async function createChatTitle(input: string): Promise<string> {
  // 클라이언트에서 호출
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: input }),
  });
  const data = await response.json(); // { title: "요약된 제목" }
  return data.title;
}

export async function syncFrameworkDocuments() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_FRAMEWORK_API_BASE}/sync/run`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }
  return response.status;
}

// ----- 채팅방/메시지 API (MSSQL Stored Procedure 백엔드) -----
//
// [상태 업데이트 예시]
// 메시지 모델: { id, message_id?, role: "user"|"assistant", content: string, isStreaming?: boolean }
// 1) 신규 채팅: chatId 없음 -> createChatRoomIfNeeded(emp_no, prompt) -> chatId 저장, 채팅방 리스트에 반영
// 2) 유저 메시지: optimistic으로 messages에 { id: tempId, role: "user", content } 추가
//    -> insertUserMessage(chatId, prompt) 후 응답 message_id로 해당 메시지 message_id 갱신
// 3) 스트리밍: startChatStream(..., signal) 호출 전 기존 AbortController.abort(), 새 controller 생성
//    - onEvent({ type: "meta", data }) -> assistant 메시지 placeholder 추가 (message_id: data.assistant_message_id, isStreaming: true)
//    - onEvent({ type: "delta", data }) -> 해당 assistant 메시지 content에 data.text append (또는 50~150ms 버퍼 후 반영)
//    - onEvent({ type: "done" }) -> isStreaming: false, 로딩 제거
//    - onEvent({ type: "error", data }) -> 에러 표시 후 스트림 종료, cleanup

const CHAT_API_BASE = process.env.NEXT_PUBLIC_API_BASE;

function getChatBaseUrl(): string {
  if (!CHAT_API_BASE) {
    throw new Error("NEXT_PUBLIC_API_BASE is not set");
  }
  return CHAT_API_BASE.replace(/\/$/, "");
}

/**
 * 신규 채팅 시 채팅방을 생성하고 chatId를 반환한다.
 * title은 prompt를 잘라 임시 제목으로 사용한다.
 */
export async function createChatRoomIfNeeded(
  emp_no: string,
  prompt: string
): Promise<number> {
  const base = getChatBaseUrl();
  const title = prompt.trim().slice(0, 100) || "새 대화";
  // const response = await fetch(`${base}/chat/rooms`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ emp_no, title }),
  // });
  const response = await client.post(
    `/chat/rooms`,
    { emp_no: emp_no, title: title },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  console.log("response: ", response);

  if (response.status !== 200) {
    const text = response.statusText;
    let errMessage = `채팅방 생성 실패: ${response.status}`;
    try {
      const json = JSON.parse(text) as { message?: string; detail?: string };
      errMessage += ` - ${json.message ?? json.detail ?? text}`;
    } catch {
      if (text) errMessage += ` - ${text}`;
    }
    throw new Error(errMessage);
  }

  const data = (await camelcaseKeys(response.data)) as CreateChatRoomResponse;
  if (typeof data.chatId !== "number") {
    throw new Error("Invalid response: chatId is required");
  }
  return data.chatId;
}

/**
 * 유저 메시지를 DB에 저장하고 message_id를 반환한다.
 */
export async function insertUserMessage(
  chatId: number,
  content: string
): Promise<number> {
  const base = getChatBaseUrl();
  const response = await fetch(`${base}/chat/rooms/${chatId}/messages/user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: content.trim() }),
  });

  if (!response.ok) {
    const text = await response.text();
    let errMessage = `유저 메시지 저장 실패: ${response.status}`;
    try {
      const json = JSON.parse(text) as { message?: string; detail?: string };
      errMessage += ` - ${json.message ?? json.detail ?? text}`;
    } catch {
      if (text) errMessage += ` - ${text}`;
    }
    throw new Error(errMessage);
  }

  const data = (await response.json()) as InsertUserMessageResponse;
  if (typeof data.message_id !== "number") {
    throw new Error("Invalid response: message_id is required");
  }
  return data.message_id;
}

/**
 * fetch + ReadableStream으로 SSE를 파싱하고 onEvent로 이벤트를 전달한다.
 * meta 전에 오는 delta는 버퍼에 모았다가 meta 수신 후 합쳐서 한 번에 delta로 전달한다.
 */
export async function parseSSEStream(
  readableStream: ReadableStream<Uint8Array>,
  onEvent: (event: StreamEvent) => void,
  options?: { bufferDeltaUntilMeta?: boolean }
): Promise<void> {
  const bufferDeltaUntilMeta = options?.bufferDeltaUntilMeta ?? true;
  const decoder = new TextDecoder();
  let buffer = "";
  let currentEventType: string | null = null;
  let deltaBufferBeforeMeta: string[] = [];
  let metaReceived = false;
  let doneEmitted = false;

  const flushDeltaBuffer = () => {
    if (deltaBufferBeforeMeta.length === 0) return;
    onEvent({
      type: "delta",
      data: { text: deltaBufferBeforeMeta.join("") },
    });
    deltaBufferBeforeMeta = [];
  };

  const emitDone = (data: StreamDoneData = {}) => {
    if (doneEmitted) return;
    doneEmitted = true;
    onEvent({ type: "done", data });
  };

  const getDeltaText = (data: Record<string, unknown>): string | null => {
    const direct =
      (data as any).text ?? (data as any).delta ?? (data as any).content;
    if (typeof direct === "string" && direct.length > 0) return direct;

    const nestedContent = (data as any)?.choices?.[0]?.delta?.content;
    if (typeof nestedContent === "string" && nestedContent.length > 0) {
      return nestedContent;
    }

    return null;
  };

  const processLine = (line: string): void => {
    if (line.startsWith("event:")) {
      currentEventType = line.slice(6).trim();
      return;
    }
    if (line.startsWith("data:")) {
      const raw = line.slice(5).trim();
      if (raw === "") return;
      if (raw === "[DONE]") {
        flushDeltaBuffer();
        emitDone({});
        currentEventType = null;
        return;
      }
      try {
        const data = JSON.parse(raw) as Record<string, unknown>;
        const inferredType =
          typeof data.type === "string"
            ? data.type
            : (currentEventType ?? "delta");
        const type = inferredType.toLowerCase();

        if (type === "meta") {
          flushDeltaBuffer();
          metaReceived = true;
          onEvent({
            type: "meta",
            data: data as unknown as StreamMetaData,
          });
        } else if (type === "delta") {
          const deltaText = getDeltaText(data);
          if (deltaText) {
            if (bufferDeltaUntilMeta && !metaReceived) {
              deltaBufferBeforeMeta.push(deltaText);
            } else {
              onEvent({ type: "delta", data: { text: deltaText } });
            }
          }
        } else if (type === "done") {
          flushDeltaBuffer();
          emitDone(data as unknown as StreamDoneData);
        } else if (type === "error") {
          flushDeltaBuffer();
          onEvent({
            type: "error",
            data: data as unknown as StreamErrorData,
          });
        }
      } catch {
        // JSON 파싱 실패 시 해당 라인 스킵
      }
      currentEventType = null;
    }
  };

  const reader = readableStream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        processLine(line);
      }
    }
    if (buffer.trim()) {
      buffer.split("\n").forEach(processLine);
    }
    flushDeltaBuffer();
  } finally {
    reader.releaseLock();
  }
}

const DEFAULT_STREAM_OPTIONS: Required<ChatStreamOptions> = {
  top_k: 5,
  embedding_model: "nlpai-lab/KURE-v1",
  filters: null,
  llm_model: "gpt-5-",
  temperature: 0.2,
};

/**
 * 스트리밍 답변을 요청하고 SSE를 파싱하여 onEvent로 전달한다.
 * AbortController.signal을 넘기면 취소 시 스트림을 중단하고 리소스를 정리한다.
 */
export async function startChatStream(
  chatId: number,
  emp_no: string,
  prompt: string,
  options: ChatStreamOptions,
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const base = getChatBaseUrl();
  const opts = { ...DEFAULT_STREAM_OPTIONS, ...options };
  const body = {
    emp_no,
    prompt: prompt.trim(),
    top_k: opts.top_k,
    embedding_model: opts.embedding_model,
    filters: opts.filters,
    llm_model: opts.llm_model,
    temperature: opts.temperature,
  };

  const response = await fetch(`${base}/chat/rooms/${chatId}/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const text = await response.text();
    let errMessage = `스트리밍 요청 실패: ${response.status}`;
    try {
      const json = JSON.parse(text) as { message?: string; detail?: string };
      errMessage += ` - ${json.message ?? json.detail ?? text}`;
    } catch {
      if (text) errMessage += ` - ${text}`;
    }
    throw new Error(errMessage);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/event-stream")) {
    const text = await response.text();
    throw new Error(
      `Unexpected content-type: ${contentType}. Body: ${text.slice(0, 200)}`
    );
  }

  const stream = response.body;
  if (!stream) {
    throw new Error("Response body is not a stream");
  }

  await parseSSEStream(stream, onEvent);
}

/** 채팅방 목록 조회 (offset/limit 지원) */
export async function getChatRooms(
  empNo: string,
  offset?: number,
  limit?: number
): Promise<ChatRoomData[]> {
  const params = new URLSearchParams({ emp_no: empNo });
  if (offset != null) params.set("offset", String(offset));
  if (limit != null) params.set("limit", String(limit));

  const response = await client.get(`/chat/rooms?${params.toString()}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (response.status !== 200) {
    throw new Error(`채팅방 목록 조회 실패: ${response.status}`);
  }
  console.log("response: ", response);
  return camelcaseKeys(response.data);
}

export async function getChatMessages(
  chatId: number,
  params?: GetMessagesParams
): Promise<Turn[]> {
  const search = new URLSearchParams({ chat_id: String(chatId) });
  if (params?.before_message_id != null) {
    search.set("before_message_id", String(params.before_message_id));
  }
  if (params?.limit != null) {
    search.set("limit", String(params.limit));
  }
  const qs = search.toString();
  const response = await client.get(
    `/chat/rooms/${chatId}/messages${qs ? `?${qs}` : ""}`,
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  if (response.status !== 200) {
    throw new Error(`채팅방 목록 조회 실패: ${response.status}`);
  }
  console.log("response: ", response);
  return camelcaseKeys(response.data);
}
