export interface SearchResult {
  id: string;
  score: number;
  payload: {
    title?: string;
    content?: string;
    url?: string;
    doc_id?: string;
    [key: string]: any;
  };
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
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
