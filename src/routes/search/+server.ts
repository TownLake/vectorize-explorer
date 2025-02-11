// src/routes/search/+server.ts
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, env }) => {
  try {
    // Parse the incoming JSON body
    const { query } = await request.json();

    // Validate the input
    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid input' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate an embedding for the search query using the AI binding.
    const embeddingResponse = await env.AI.run("@cf/baai/bge-base-en-v1.5", { text: query });
    if (!embeddingResponse || !Array.isArray(embeddingResponse.data) || embeddingResponse.data.length === 0) {
      throw new Error("Failed to generate embedding");
    }
    const queryVector = embeddingResponse.data[0];

    // Query your vector index with the generated vector.
    const matches = await env.VECTORIZE.query(queryVector, {
      topK: 5,
      returnMetadata: "all"
    });

    // If no matches are returned, send back an empty array.
    if (!matches || !Array.isArray(matches.matches) || matches.matches.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Filter and map the results into the expected format.
    const results = matches.matches
      .filter((match) => match.metadata && match.metadata.title && match.metadata.slug)
      .map((match) => ({
        title: match.metadata.title,
        url: `https://blog.samrhea.com${match.metadata.slug}`,
        score: match.score ? match.score.toFixed(4) : "N/A"
      }));

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    // Return any errors with a 500 status code.
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
