export interface SearchResult {
  doc_id: string;
  title: string;
  snippet: string;
  video_url: string;
  video_label: string | null;
  images: string[];
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
  images: string[];
}

export interface SearchResponseOpenAI {
  query: string;
  summary: string;
  sources: SearchSource[];
  total_sources: number;
  /** 204 No Content일 때 true */
  noContent?: boolean;
  chat_id?: number | null;
  user_message_id?: number | null;
  assistant_message_id?: number | null;
  search_id?: number | null;
  title?: string | null;
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
  model?: string;
  filters?: {
    categories?: {
      top?: string;
    };
  };
  chat_id?: number | null;
  embedding_model?: string;
  emp_no?: string;
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

type SearchLearningStreamCallbacks = {
  onDelta: (text: string) => void;
  onMeta?: (meta: StreamMetaData) => void;
  onError?: (err: StreamErrorData) => void;
};

/** 채팅방 메시지 조회 */
export interface GetMessagesParams {
  before_message_id?: number;
  limit?: number;
}

/** 채팅방 생성 응답 */
export interface CreateChatRoomResponse {
  chatId: number;
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
  chat_id?: number | null;
  user_message_id?: number | null;
  assistant_message_id?: number | null;
  search_id?: number | null;
  usage_id?: number;
  elapsed_ms?: number;
  title?: string | null;
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

/* 채팅룸 */
export type ChatRoomData = {
  chatId?: number | null;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Turn = {
  query: string;
  summary: string;
  results: SearchResult[];
  filters?: string;
};

export type ChatMessage = {
  chatId: number;
  messageId: number;
  content: string;
  createdAt: string;
  responseTimeMs: number;
  role: string;
};
