// src/routes/search/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, env }) => {
	try {
		// Parse the JSON payload sent from the client
		const { query } = await request.json();

		// Validate the query input
		if (!query || typeof query !== 'string') {
			return json({ error: 'Invalid input' }, { status: 400 });
		}

		// Generate the embedding using your AI binding
		// Ensure that your binding name is "AI" in your wrangler.toml or Cloudflare Pages settings
		const embeddingResponse = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: query });

		// Verify that the embedding was generated successfully
		if (
			!embeddingResponse ||
			!Array.isArray(embeddingResponse.data) ||
			embeddingResponse.data.length === 0
		) {
			throw new Error('Failed to generate embedding');
		}

		// Use the first embedding as the query vector
		const queryVector = embeddingResponse.data[0];

		// Query your VECTORIZE binding (ensure the binding name is "VECTORIZE")
		const matches = await env.VECTORIZE.query(queryVector, {
			topK: 5,
			returnMetadata: 'all'
		});

		// If no matches are found, return an empty array
		if (!matches || !Array.isArray(matches.matches) || matches.matches.length === 0) {
			return json([]);
		}

		// Format the matches into the desired output
		const results = matches.matches
			.filter((match: any) =>
				match.metadata &&
				match.metadata.title &&
				match.metadata.slug
			)
			.map((match: any) => ({
				title: match.metadata.title,
				url: `https://blog.samrhea.com${match.metadata.slug}`,
				score: match.score ? match.score.toFixed(4) : 'N/A'
			}));

		return json(results);
	} catch (error: any) {
		// Return any errors that occur with a 500 status
		return json({ error: error.message }, { status: 500 });
	}
};
