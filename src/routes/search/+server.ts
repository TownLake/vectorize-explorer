// src/routes/search/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, env }) => {
	try {
		// Log to check if the bindings are present (similar to your Next.js example)
		console.log('AI binding check:', !!env.AI);
		console.log('VECTORIZE binding check:', !!env.VECTORIZE);

		// Parse the incoming request body
		const { query } = await request.json();
		if (!query || typeof query !== 'string') {
			return json({ error: 'Invalid input' }, { status: 400 });
		}

		// Verify that the AI binding is available
		if (!env.AI) {
			console.error('AI binding not found');
			throw new Error('AI binding not found');
		}

		// Verify that the VECTORIZE binding is available
		if (!env.VECTORIZE) {
			console.error('VECTORIZE binding not found');
			throw new Error('VECTORIZE binding not found');
		}

		// Generate the embedding using the AI binding
		const embeddingResponse = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: query });
		if (
			!embeddingResponse ||
			!Array.isArray(embeddingResponse.data) ||
			embeddingResponse.data.length === 0
		) {
			throw new Error('Failed to generate embedding');
		}
		const queryVector = embeddingResponse.data[0];

		// Query the vector index via the VECTORIZE binding
		const matches = await env.VECTORIZE.query(queryVector, {
			topK: 5,
			returnMetadata: 'all'
		});

		// If no matches are found, return an empty array
		if (!matches || !Array.isArray(matches.matches) || matches.matches.length === 0) {
			return json([]);
		}

		// Map the results to the desired output format
		const results = matches.matches
			.filter((match: any) => 
				match.metadata && match.metadata.title && match.metadata.slug
			)
			.map((match: any) => ({
				title: match.metadata.title,
				url: `https://blog.samrhea.com${match.metadata.slug}`,
				score: match.score ? match.score.toFixed(4) : 'N/A'
			}));

		return json(results);
	} catch (error: any) {
		console.error('Error in search endpoint:', error);
		return json({ error: error.message }, { status: 500 });
	}
};
