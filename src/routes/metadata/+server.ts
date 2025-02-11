import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Define the Vectorize binding interface
interface VectorizeBinding {
    list: (options?: {
        cursor?: string;
        limit?: number;
    }) => Promise<{
        data: Array<{
            id: string;
            metadata?: Record<string, any>;
        }>;
        cursor?: string;
        done: boolean;
    }>;
}

// Define the complete platform environment interface
interface Platform {
    env?: {
        VECTORIZE: VectorizeBinding;
    };
}

export const GET: RequestHandler = async ({ platform }) => {
    // Type assertion for platform
    const env = (platform as Platform)?.env;

    // Early validation of the Vectorize binding
    if (!env?.VECTORIZE) {
        console.error('Vectorize binding not found in environment');
        throw error(500, {
            message: 'Server configuration error: Vectorize binding not available'
        });
    }

    try {
        const allMetadata: Array<Record<string, any>> = [];
        let cursor: string | undefined;
        let done = false;

        // Paginate through all vectors
        while (!done) {
            try {
                const response = await env.VECTORIZE.list({
                    cursor,
                    limit: 100 // Reduced for better performance
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
                console.error('Error during pagination:', listError);
                throw error(500, {
                    message: 'Error while fetching vectorize entries',
                    cause: listError instanceof Error ? listError.message : 'Unknown error'
                });
            }
        }

        // Handle case where no metadata was found
        if (allMetadata.length === 0) {
            return json({
                metadata: [],
                stats: {
                    totalEntries: 0,
                    uniqueTitles: 0,
                    metadataFields: []
                },
                timestamp: new Date().toISOString()
            });
        }

        // Calculate statistics
        const stats = {
            totalEntries: allMetadata.length,
            uniqueTitles: new Set(allMetadata.map(entry => entry.title).filter(Boolean)).size,
            metadataFields: Array.from(
                new Set(
                    allMetadata.flatMap(entry => Object.keys(entry))
                )
            )
        };

        return json({
            metadata: allMetadata,
            stats,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error('Metadata fetch error:', err);
        
        // If it's already a SvelteKit error, rethrow it
        if (err instanceof Error && 'status' in err) {
            throw err;
        }
        
        // Otherwise, wrap it in a new error
        throw error(500, {
            message: 'An error occurred while fetching metadata',
            cause: err instanceof Error ? err.message : 'Unknown error'
        });
    }
};