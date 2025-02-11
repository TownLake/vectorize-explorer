// src/routes/search/+server.ts
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, env }) => {
  try {
    console.log("env keys:", Object.keys(env)); // diagnostic logging

    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid input' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!env.AI) {
      throw new Error("Missing AI binding in env");
    }

    const embeddingResponse = await env.AI.run("@cf/baai/bge-base-en-v1.5", { text: query });
    if (!embeddingResponse || !Array.isArray(embeddingResponse.data) || embeddingResponse.data.length === 0) {
      throw new Error("Failed to generate embedding");
    }
    const queryVector = embeddingResponse.data[0];

    if (!env.VECTORIZE) {
      throw new Error("Missing VECTORIZE binding in env");
    }
    const matches = await env.VECTORIZE.query(queryVector, {
      topK: 5,
      returnMetadata: "all"
    });

    if (!matches || !Array.isArray(matches.matches) || matches.matches.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

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
    console.error("Search error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
