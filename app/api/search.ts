// functions/search.ts

export async function onRequestPost(context: any): Promise<Response> {
    const { request, env } = context;
  
    try {
      // 1) Parse the request JSON
      const { query } = await request.json<{
        query?: string;
      }>();
  
      if (!query || typeof query !== "string") {
        return new Response(JSON.stringify({ error: "Invalid input" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
  
      // 2) Run embedding using your AI binding in wrangler.toml
      //    e.g. [ai] binding = "AI"
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
  
      // 3) Query your Vectorize index (as set in wrangler.toml)
      //    e.g. [[vectorize]] binding = "VECTORIZE"
      const matches = await env.VECTORIZE.query(queryVector, {
        topK: 5,
        returnMetadata: "all",
      });
  
      if (!matches || !Array.isArray(matches.matches) || matches.matches.length === 0) {
        // No results? Return an empty array
        return new Response(JSON.stringify([]), {
          headers: { "Content-Type": "application/json" },
        });
      }
  
      // 4) Map the results to the shape your front-end expects
      const results = matches.matches
        .filter((match) => match.metadata && match.metadata.title && match.metadata.slug)
        .map((match) => ({
          title: match.metadata.title,
          url: `https://blog.samrhea.com${match.metadata.slug}`,
          score: match.score ? match.score.toFixed(4) : "N/A",
        }));
  
      return new Response(JSON.stringify(results), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      // 5) Handle errors gracefully
      return new Response(
        JSON.stringify({
          error: error.message || "An unknown error occurred.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }
  