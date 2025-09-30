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
