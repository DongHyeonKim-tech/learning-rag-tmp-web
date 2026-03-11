import {
  SearchParams,
  SearchResponse,
  SearchParamsOpenAI,
  SearchResponseOpenAI,
  SearchParamsFramework,
  SearchResponseFramework,
  SearchLearningStreamCallbacks,
  GetMessagesParams,
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
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/chat`, {
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

/**
 * fetch + ReadableStream으로 SSE를 파싱하고 onEvent로 이벤트를 전달한다.
 * options.bufferDeltaUntilMeta가 true면 meta 이전 delta를 버퍼링한다.
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
  return camelcaseKeys(response.data);
}
