import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface Env {
    VECTORIZE: {
        list: (options?: {
            cursor?: string;
            limit?: number;
        }) => Promise<{
            data: Array<{
                id: string;
                metadata?: {
                    title?: string;
                    slug?: string;
                    [key: string]: any;  // Allow for additional metadata fields
                };
            }>;
            cursor?: string;
            done: boolean;
        }>;
    };
}

export const GET: RequestHandler = async ({ platform }) => {
    const env = platform?.env as Env;

    if (!env?.VECTORIZE) {
        throw error(500, 'Server configuration error: Vectorize not available');
    }

    try {
        const allMetadata = [];
        let cursor: string | undefined;
        let done = false;

        // Paginate through all vectors to get complete metadata
        while (!done) {
            const response = await env.VECTORIZE.list({
                cursor,
                limit: 1000  // Adjust this value based on your needs
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
        }

        // Calculate some basic statistics
        const stats = {
            totalEntries: allMetadata.length,
            uniqueTitles: new Set(allMetadata.map(entry => entry.title)).size,
            metadataFields: Object.keys(allMetadata[0] || {})
        };

        return json({
            metadata: allMetadata,
            stats,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error('Metadata fetch error:', err);
        
        if (err instanceof Error && 'status' in err) {
            throw err;
        }
        
        throw error(
            500,
            'An error occurred while fetching metadata'
        );
    }
};