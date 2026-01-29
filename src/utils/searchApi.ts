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
