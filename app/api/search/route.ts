// app/api/search/route.ts

// Tell Next.js to run this API route as an Edge Function (so that Cloudflare’s bindings are available)
export const runtime = "edge";

export async function POST(
  request: Request,
  { env }: { env: { AI: any; VECTORIZE: any } }
) {
  try {
    // Parse the request JSON and validate the "query" parameter.
    const { query } = await request.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate an embedding for the search term using the Workers AI binding.
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

    // Query the vector database using the generated embedding.
    const matches = await env.VECTORIZE.query(queryVector, {
      topK: 5,
      returnMetadata: "all",
    });

    // If there are no matches, return an empty array.
    if (
      !matches ||
      !Array.isArray(matches.matches) ||
      matches.matches.length === 0
    ) {
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Transform the matches into the expected format.
    const results = matches.matches
      .filter(
        (match: any) =>
          match.metadata && match.metadata.title && match.metadata.slug
      )
      .map((match: any) => ({
        title: match.metadata.title,
        url: `https://blog.samrhea.com${match.metadata.slug}`, // Update the base URL as needed.
        score: match.score ? match.score.toFixed(4) : "N/A",
      }));

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
