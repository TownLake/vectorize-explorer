// functions/api/search.ts

// This export is specific to Cloudflare Pages Functions.
// The onRequest handler receives the request and the environment bindings.
export async function onRequest(context: {
    request: Request;
    env: {
      AI: any;
      VECTORIZE: any;
    };
  }) {
    const { request, env } = context;
  
    // Only allow POST requests
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }
  
    // Parse the JSON body
    let data;
    try {
      data = await request.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  
    const { query } = data;
    if (!query || typeof query !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid input" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  
    try {
      // Generate an embedding for the query using the AI binding.
      const embeddingResponse = await env.AI.run("@cf/baai/bge-base-en-v1.5", { text: query });
      if (
        !embeddingResponse ||
        !Array.isArray(embeddingResponse.data) ||
        embeddingResponse.data.length === 0
      ) {
        throw new Error("Failed to generate embedding");
      }
      const queryVector = embeddingResponse.data[0];
  
      // Use the vector binding to query for similar items.
      const matches = await env.VECTORIZE.query(queryVector, {
        topK: 5,
        returnMetadata: "all",
      });
  
      // If no matches are found, return an empty array.
      if (!matches || !Array.isArray(matches.matches) || matches.matches.length === 0) {
        return new Response(JSON.stringify([]), {
          headers: { "Content-Type": "application/json" },
        });
      }
  
      // Map the matches to your expected output format.
      // (This example assumes your metadata has "title" and "slug". Adjust the URL as needed.)
      const results = matches.matches
        .filter(
          (match: any) =>
            match.metadata &&
            match.metadata.title &&
            match.metadata.slug
        )
        .map((match: any) => ({
          title: match.metadata.title,
          url: `https://blog.samrhea.com${match.metadata.slug}`,
          score: match.score ? match.score.toFixed(4) : "N/A",
        }));
  
      return new Response(JSON.stringify(results), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(
        JSON.stringify({ error: error.message || "Unknown error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }
  