// src/routes/search/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		// Parse the JSON payload sent from the client
		const { query } = await request.json();

		// Validate the query input
		if (!query || typeof query !== 'string') {
			return json({ error: 'Invalid input' }, { status: 400 });
		}

		// Use the AI binding to generate an embedding for the query.
		// Note: Make sure the AI binding name in your wrangler.toml or _config is "AI"
		const embeddingResponse = await platform.AI.run('@cf/baai/bge-base-en-v1.5', { text: query });

		// Check that the embedding was generated properly
		if (
			!embeddingResponse ||
			!Array.isArray(embeddingResponse.data) ||
			embeddingResponse.data.length === 0
		) {
			throw new Error('Failed to generate embedding');
		}

		// Use the first generated embedding as the query vector
		const queryVector = embeddingResponse.data[0];

		// Query the VECTORIZE binding with the vector.
		// Ensure your VECTORIZE binding is set up with binding name "VECTORIZE" and your index name is correct.
		const matches = await platform.VECTORIZE.query(queryVector, {
			topK: 5,
			returnMetadata: 'all'
		});

		// If no matches are found, return an empty array
		if (!matches || !Array.isArray(matches.matches) || matches.matches.length === 0) {
			return json([]);
		}

		// Map the results to the desired output format
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
				score: match.score ? match.score.toFixed(4) : 'N/A'
			}));

		return json(results);
	} catch (error: any) {
		// If an error occurs, return it with a 500 status
		return json({ error: error.message }, { status: 500 });
	}
};
