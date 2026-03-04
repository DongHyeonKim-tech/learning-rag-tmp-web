export interface SearchResult {
  doc_id: string;
  title: string;
  snippet: string;
  video_url: string;
  video_label: string | null;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  total_count: number;
}

export interface SearchSource {
  doc_id: string;
  title: string;
  video_url: string;
  video_label: string;
  snippet: string;
}

export interface SearchResponseOpenAI {
  query: string;
  summary: string;
  sources: SearchSource[];
  total_sources: number;
  /** 204 No Content일 때 true */
  noContent?: boolean;
}

export interface SearchParams {
  messages: { role: string; content: string }[];
  top_k?: number;
  use_context?: number;
  filters?: {
    categories?: {
      top?: string;
      upper?: string;
    };
  };
}

export interface SearchParamsOpenAI {
  query: string;
  top_k?: number;
  use_context?: number;
  temperature?: number;
  max_tokens?: number;
  model?: string;
  filters?: {
    categories?: {
      top?: string;
    };
  };
}

export interface SearchParamsFramework {
  query: string;
  top_k?: number;
  use_context?: number;
  filters?: {
    category_path?: string[];
  };
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  model?: string;
  use_kure?: boolean;
}

export interface SearchResponseFramework {
  prompt: string;
  answer: string;
  images?: {
    id: string;
    file_path: string;
  }[];
  links?: string[];
  sources?: {
    url: string;
  }[];
  total_sources?: number;
}

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

export interface SearchLearningStreamCallbacks {
  onDelta: (content: string) => void;
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
      max_tokens: params.max_tokens,
      filters: params.filters,
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

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("Stream not supported");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let finalResult: SearchResponseOpenAI | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const payload = JSON.parse(line.slice(6)) as {
            type: string;
            content?: string;
            text?: string;
            sources?: SearchSource[];
          };
          if (payload.type === "delta" && payload.content != null) {
            callbacks.onDelta(payload.content);
          } else if (payload.type === "done") {
            finalResult = {
              query: params.query,
              summary: payload.text ?? "",
              sources: payload.sources ?? [],
              total_sources: payload.sources?.length ?? 0,
            };
          }
        } catch {
          // JSON 파싱 실패 시 해당 라인 스킵
        }
      }
    }
  }

  if (!finalResult) {
    return {
      query: params.query,
      summary: "",
      sources: [],
      total_sources: 0,
    };
  }
  return finalResult;
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
// 1) 신규 채팅: chat_id 없음 -> createChatRoomIfNeeded(emp_no, prompt) -> chat_id 저장, 채팅방 리스트에 반영
// 2) 유저 메시지: optimistic으로 messages에 { id: tempId, role: "user", content } 추가
//    -> insertUserMessage(chat_id, prompt) 후 응답 message_id로 해당 메시지 message_id 갱신
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

/** 채팅방 생성 응답 */
export interface CreateChatRoomResponse {
  chat_id: number;
}

/** 유저 메시지 저장 응답 */
export interface InsertUserMessageResponse {
  message_id: number;
}

/** 스트리밍 요청 옵션 */
export interface ChatStreamOptions {
  top_k?: number;
  embedding_model?: string;
  filters?: Record<string, unknown> | null;
  llm_model?: string;
  temperature?: number;
}

/** SSE meta 이벤트 데이터 */
export interface StreamMetaData {
  chat_id: number;
  user_message_id: number;
  assistant_message_id: number;
  search_id?: number;
  refs_inserted?: number;
}

/** SSE delta 이벤트 데이터 */
export interface StreamDeltaData {
  text: string;
}

/** SSE done 이벤트 데이터 */
export interface StreamDoneData {
  usage_id?: number;
  elapsed_ms?: number;
}

/** SSE error 이벤트 데이터 */
export interface StreamErrorData {
  code?: string;
  message?: string;
}

/** 스트림 이벤트 콜백용 유니온 */
export type StreamEvent =
  | { type: "meta"; data: StreamMetaData }
  | { type: "delta"; data: StreamDeltaData }
  | { type: "done"; data: StreamDoneData }
  | { type: "error"; data: StreamErrorData };

/**
 * 신규 채팅 시 채팅방을 생성하고 chat_id를 반환한다.
 * title은 prompt를 잘라 임시 제목으로 사용한다.
 */
export async function createChatRoomIfNeeded(
  emp_no: string,
  prompt: string
): Promise<number> {
  const base = getChatBaseUrl();
  const title = prompt.trim().slice(0, 100) || "새 대화";
  const response = await fetch(`${base}/chat/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emp_no, title }),
  });

  if (!response.ok) {
    const text = await response.text();
    let errMessage = `채팅방 생성 실패: ${response.status}`;
    try {
      const json = JSON.parse(text) as { message?: string; detail?: string };
      errMessage += ` - ${json.message ?? json.detail ?? text}`;
    } catch {
      if (text) errMessage += ` - ${text}`;
    }
    throw new Error(errMessage);
  }

  const data = (await response.json()) as CreateChatRoomResponse;
  if (typeof data.chat_id !== "number") {
    throw new Error("Invalid response: chat_id is required");
  }
  return data.chat_id;
}

/**
 * 유저 메시지를 DB에 저장하고 message_id를 반환한다.
 */
export async function insertUserMessage(
  chat_id: number,
  content: string
): Promise<number> {
  const base = getChatBaseUrl();
  const response = await fetch(
    `${base}/chat/rooms/${chat_id}/messages/user`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim() }),
    }
  );

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
  onEvent: (event: StreamEvent) => void
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = "";
  let currentEventType: string | null = null;
  let deltaBufferBeforeMeta: string[] = [];
  let metaReceived = false;

  const processLine = (line: string): void => {
    if (line.startsWith("event:")) {
      currentEventType = line.slice(6).trim();
      return;
    }
    if (line.startsWith("data:")) {
      const raw = line.slice(5).trim();
      if (raw === "[DONE]" || raw === "") return;
      try {
        const data = JSON.parse(raw) as Record<string, unknown>;
        const type = (currentEventType ?? "delta").toLowerCase();

        if (type === "meta") {
          if (deltaBufferBeforeMeta.length > 0) {
            const combined = deltaBufferBeforeMeta.join("");
            deltaBufferBeforeMeta = [];
            onEvent({ type: "delta", data: { text: combined } });
          }
          metaReceived = true;
          onEvent({
            type: "meta",
            data: data as unknown as StreamMetaData,
          });
        } else if (type === "delta") {
          if (data.text != null && typeof data.text === "string") {
            if (!metaReceived) {
              deltaBufferBeforeMeta.push(data.text);
            } else {
              onEvent({ type: "delta", data: { text: data.text } });
            }
          }
        } else if (type === "done") {
          if (deltaBufferBeforeMeta.length > 0) {
            onEvent({
              type: "delta",
              data: { text: deltaBufferBeforeMeta.join("") },
            });
            deltaBufferBeforeMeta = [];
          }
          onEvent({ type: "done", data: data as unknown as StreamDoneData });
        } else if (type === "error") {
          if (deltaBufferBeforeMeta.length > 0) {
            onEvent({
              type: "delta",
              data: { text: deltaBufferBeforeMeta.join("") },
            });
            deltaBufferBeforeMeta = [];
          }
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
    if (deltaBufferBeforeMeta.length > 0) {
      onEvent({ type: "delta", data: { text: deltaBufferBeforeMeta.join("") } });
    }
  } finally {
    reader.releaseLock();
  }
}

const DEFAULT_STREAM_OPTIONS: Required<ChatStreamOptions> = {
  top_k: 5,
  embedding_model: "BAAI/bge-m3",
  filters: null,
  llm_model: "EXAONE-4.0-32B",
  temperature: 0.2,
};

/**
 * 스트리밍 답변을 요청하고 SSE를 파싱하여 onEvent로 전달한다.
 * AbortController.signal을 넘기면 취소 시 스트림을 중단하고 리소스를 정리한다.
 */
export async function startChatStream(
  chat_id: number,
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

  const response = await fetch(`${base}/chat/rooms/${chat_id}/stream`, {
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
    throw new Error(`Unexpected content-type: ${contentType}. Body: ${text.slice(0, 200)}`);
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
): Promise<{ data?: unknown[]; [key: string]: unknown }> {
  const base = getChatBaseUrl();
  const params = new URLSearchParams({ emp_no: empNo });
  if (offset != null) params.set("offset", String(offset));
  if (limit != null) params.set("limit", String(limit));
  const response = await fetch(
    `${base}/chat/rooms?${params.toString()}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    throw new Error(`채팅방 목록 조회 실패: ${response.status}`);
  }

  return response.json();
}

/** 채팅방 메시지 조회 */
export interface GetMessagesParams {
  before_message_id?: number;
  limit?: number;
}

export async function getChatMessages(
  chat_id: number,
  params?: GetMessagesParams
): Promise<{ data?: unknown[]; [key: string]: unknown }> {
  const base = getChatBaseUrl();
  const search = new URLSearchParams();
  if (params?.before_message_id != null) {
    search.set("before_message_id", String(params.before_message_id));
  }
  if (params?.limit != null) {
    search.set("limit", String(params.limit));
  }
  const qs = search.toString();
  const url = `${base}/chat/rooms/${chat_id}/messages${qs ? `?${qs}` : ""}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`메시지 조회 실패: ${response.status}`);
  }

  return response.json();
}
