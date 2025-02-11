import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Define a more specific Vectorize response type
interface VectorizeEntry {
    id: string;
    metadata?: Record<string, any>;
}

interface VectorizeResponse {
    data: VectorizeEntry[];
    cursor?: string;
    done: boolean;
}

interface VectorizeBinding {
    list: (options?: {
        cursor?: string;
        limit?: number;
    }) => Promise<VectorizeResponse>;
}

export const GET: RequestHandler = async ({ platform, request }) => {
    console.log('Request received:', request.url);
    console.log('Platform object:', JSON.stringify(platform, null, 2));

    // Check if we're running in Cloudflare Pages
    if (!platform) {
        console.error('No platform object available');
        throw error(500, {
            message: 'Not running in Cloudflare Pages environment'
        });
    }

    // Explicit type check for Cloudflare environment
    const env = platform.env;
    console.log('Environment bindings:', Object.keys(env || {}));

    if (!env) {
        console.error('No env object in platform');
        throw error(500, {
            message: 'No environment bindings available'
        });
    }

    // Check for VECTORIZE binding
    if (!env.VECTORIZE) {
        console.error('VECTORIZE binding not found');
        throw error(500, {
            message: 'VECTORIZE binding not found in environment',
            available_bindings: Object.keys(env)
        });
    }

    // Validate that VECTORIZE has the list method
    if (typeof env.VECTORIZE.list !== 'function') {
        console.error('VECTORIZE.list is not a function');
        throw error(500, {
            message: 'Invalid VECTORIZE binding configuration'
        });
    }

    try {
        const allMetadata: Record<string, any>[] = [];
        let cursor: string | undefined;
        let done = false;
        let pageCount = 0;

        while (!done && pageCount < 10) { // Added safety limit
            pageCount++;
            console.log(`Fetching page ${pageCount}, cursor: ${cursor || 'initial'}`);

            try {
                const response = await env.VECTORIZE.list({
                    cursor,
                    limit: 50 // Reduced further for testing
                });

                console.log(`Page ${pageCount} response:`, {
                    dataCount: response.data.length,
                    hasNextPage: !response.done,
                    cursor: response.cursor
                });

                const metadataEntries = response.data
                    .filter(entry => entry.metadata)
                    .map(entry => ({
                        id: entry.id,
                        ...entry.metadata
                    }));

                allMetadata.push(...metadataEntries);
                cursor = response.cursor;
                done = response.done;

            } catch (listError) {
                console.error(`Error on page ${pageCount}:`, listError);
                throw error(500, {
                    message: 'Error fetching vectorize page',
                    page: pageCount,
                    cause: listError instanceof Error ? listError.message : 'Unknown error'
                });
            }
        }

        if (pageCount >= 10 && !done) {
            console.warn('Reached maximum page limit');
        }

        const stats = {
            totalEntries: allMetadata.length,
            pagesProcessed: pageCount,
            uniqueTitles: new Set(allMetadata.map(entry => entry.title).filter(Boolean)).size,
            metadataFields: Array.from(
                new Set(
                    allMetadata.flatMap(entry => Object.keys(entry))
                )
            )
        };

        console.log('Final stats:', stats);

        return json({
            metadata: allMetadata,
            stats,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error('Top-level error:', err);
        
        if (err instanceof Error && 'status' in err) {
            throw err;
        }
        
        throw error(500, {
            message: 'Failed to fetch metadata',
            error: err instanceof Error ? err.message : 'Unknown error'
        });
    }
};