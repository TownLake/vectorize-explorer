import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Define the environment variables interface
interface Env {
    AI: {
        run: (model: string, params: { text: string }) => Promise<{
            data: number[][];
        }>;
    };
    VECTORIZE: {
        query: (
            vector: number[],
            options: {
                topK: number;
                returnMetadata: string;
            }
        ) => Promise<{
            matches: Array<{
                metadata?: {
                    title?: string;
                    slug?: string;
                };
                score?: number;
            }>;
        }>;
    };
}

// Define the search result interface
interface SearchResult {
    title: string;
    url: string;
    score: string;
}

export const POST: RequestHandler = async ({ request, platform }) => {
    // Type assertion for platform environment
    const env = platform?.env as Env;

    if (!env?.AI || !env?.VECTORIZE) {
        throw error(500, 'Server configuration error: AI or Vectorize not available');
    }

    try {
        const { query } = await request.json();

        // Validate input
        if (!query || typeof query !== 'string') {
            throw error(400, 'Invalid input: query must be a non-empty string');
        }

        // Generate embedding using Workers AI
        const embeddingResponse = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
            text: query
        });

        if (!embeddingResponse?.data?.[0]) {
            throw error(500, 'Failed to generate embedding');
        }

        const queryVector = embeddingResponse.data[0];

        // Query Vectorize DB
        const matches = await env.VECTORIZE.query(queryVector, {
            topK: 5,
            returnMetadata: 'all'
        });

        if (!matches?.matches) {
            return json([]);
        }

        // Process and format results
        const results: SearchResult[] = matches.matches
            .filter((match) => match.metadata?.title && match.metadata?.slug)
            .map((match) => ({
                title: match.metadata!.title!,
                url: `https://blog.samrhea.com${match.metadata!.slug!}`,
                score: match.score?.toFixed(4) ?? 'N/A'
            }));

        return json(results);
    } catch (err) {
        console.error('Search error:', err);
        
        // If it's already a SvelteKit error, rethrow it
        if (err instanceof Error && 'status' in err) {
            throw err;
        }
        
        // Otherwise, throw a generic error
        throw error(
            500,
            'An error occurred while processing your search request'
        );
    }
};