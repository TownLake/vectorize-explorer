// functions/search.ts

/**
 * Minimal interface for the AI binding in wrangler.toml:
 * [ai]
 * binding = "AI"
 */
interface AI {
    run(
      model: string,
      data: { text: string }
    ): Promise<{
      data: number[][];
    }>;
  }
  
  /**
   * Minimal interface for the Vectorize binding in wrangler.toml:
   * [[vectorize]]
   * binding = "VECTORIZE"
   * index_name = "blog-posts"
   */
  interface VectorizeIndex {
    query(
      vector: number[],
      options: {
        topK: number;
        returnMetadata: "all" | "none";
      }
    ): Promise<{
      matches: Array<{
        score?: number;
        metadata?: {
          title?: string;
          slug?: string;
        };
      }>;
    }>;
  }
  
  /** Environment bindings from wrangler.toml */
  interface Env {
    AI: AI;
    VECTORIZE: VectorizeIndex;
  }
  
  /** Shape of the incoming request body */
  interface SearchRequestBody {
    query?: string;
  }
  
  /** Shape of each match we return to the frontend */
  interface SearchResult {
    title: string;
    url: string;
    score: string;
  }
  
  /**
   * Cloudflare Pages Function context
   */
  interface PagesFunctionContext {
    request: Request;
    env: Env;
    params: Record<string, string | string[]>;
    waitUntil(promise: Promise<unknown>): void;
    next: () => Promise<Response>;
    data: Record<string, unknown>;
  }
  
  export async function onRequestPost(
    context: PagesFunctionContext
  ): Promise<Response> {
    const { request, env } = context;
  
    try {
      // 1) Parse JSON body
      const body = (await request.json()) as SearchRequestBody;
      const query = body.query?.trim() || "";
  
      if (!query) {
        return new Response(JSON.stringify({ error: "Invalid input" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
  
      // 2) Create embedding via AI binding
      const embeddingResponse = await env.AI.run("@cf/baai/bge-base-en-v1.5", {
        text: query,
      });
  
      if (
        !embeddingResponse ||
        !Array.isArray(embeddingResponse.data) ||
        embeddingResponse.data.length === 0
      ) {
        throw new Error("Failed to generate embedding");
      }
  
      const queryVector = embeddingResponse.data[0];
  
      // 3) Query Vectorize
      const searchResult = await env.VECTORIZE.query(queryVector, {
        topK: 5,
        returnMetadata: "all",
      });
  
      if (
        !searchResult ||
        !Array.isArray(searchResult.matches) ||
        searchResult.matches.length === 0
      ) {
        return new Response(JSON.stringify([]), {
          headers: { "Content-Type": "application/json" },
        });
      }
  
      // 4) Shape the results
      const results: SearchResult[] = searchResult.matches
        .filter((m) => m.metadata?.title && m.metadata?.slug)
        .map((match) => {
          const scoreValue = match.score ?? null;
          return {
            title: match.metadata!.title,
            url: `https://blog.samrhea.com${match.metadata!.slug}`,
            score: scoreValue !== null ? scoreValue.toFixed(4) : "N/A",
          };
        });
  
      // 5) Return JSON
      return new Response(JSON.stringify(results), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: unknown) {
      let errorMessage = "An unknown error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
  
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
  