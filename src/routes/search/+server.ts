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

export const GET: RequestHandler = async ({ platform, request }) => {
  console.log('Metadata endpoint invoked:', request.url);

  if (!platform) {
    console.error('No platform object available');
    throw error(500, { message: 'Not running in Cloudflare Pages environment' });
  }

  const env = platform.env;
  if (!env) {
    console.error('No env object in platform');
    throw error(500, { message: 'No environment bindings available' });
  }

  if (!env.VECTORIZE) {
    console.error('VECTORIZE binding not found');
    throw error(500, {
      message: 'VECTORIZE binding not found in environment',
      available_bindings: Object.keys(env)
    });
  }

  if (typeof env.VECTORIZE.list !== 'function') {
    console.error('VECTORIZE.list is not a function');
    throw error(500, { message: 'Invalid VECTORIZE binding configuration' });
  }

  try {
    const allMetadata: Record<string, any>[] = [];
    let cursor: string | undefined;
    let done = false;
    let pageCount = 0;

    // Loop through pages of results
    while (!done && pageCount < 10) { // Safety limit to avoid infinite loops
      pageCount++;
      console.log(`Fetching page ${pageCount} with cursor: ${cursor || 'initial'}`);

      try {
        const response: VectorizeResponse = await env.VECTORIZE.list({
          cursor,
          limit: 50 // You can adjust this value for testing
        });

        // Log the raw response from VECTORIZE.list
        console.log(`Raw response for page ${pageCount}:`, JSON.stringify(response, null, 2));

        if (!response || !Array.isArray(response.data)) {
          console.error(`Expected an array in response.data on page ${pageCount}`, response);
          break; // Exit the loop if the response is not as expected
        }

        // Process entries that have metadata
        const metadataEntries = response.data
          .filter(entry => entry.metadata)
          .map(entry => {
            // Log each entry to inspect its structure
            console.log('Processing entry:', JSON.stringify(entry, null, 2));
            return {
              id: entry.id,
              ...entry.metadata
            };
          });

        console.log(`Page ${pageCount} produced ${metadataEntries.length} metadata entries.`);
        allMetadata.push(...metadataEntries);
        cursor = response.cursor;
        done = response.done;
      } catch (listError) {
        console.error(`Error fetching page ${pageCount}:`, listError);
        throw error(500, {
          message: 'Error fetching vectorize page',
          page: pageCount,
          cause: listError instanceof Error ? listError.message : 'Unknown error'
        });
      }
    }

    console.log('All metadata fetched:', JSON.stringify(allMetadata, null, 2));

    // Calculate some simple statistics
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

    console.log('Calculated metadata stats:', JSON.stringify(stats, null, 2));

    return json({
      metadata: allMetadata,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to fetch metadata:', err);

    if (err instanceof Error && 'status' in err) {
      throw err;
    }

    throw error(500, {
      message: 'Failed to fetch metadata',
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
};
