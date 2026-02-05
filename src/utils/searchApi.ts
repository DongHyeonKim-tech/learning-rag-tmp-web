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
