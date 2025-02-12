// +server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

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

  if (typeof env.VECTORIZE.query !== 'function') {
    console.error('VECTORIZE.query is not a function');
    throw error(500, { message: 'Invalid VECTORIZE binding configuration: query method missing' });
  }

  try {
    // Use a dummy vector to retrieve metadata.
    // Adjust the dimension (512 here) as needed.
    const dummyVector = Array(512).fill(0);
    
    // Update query parameters per the error suggestion:
    // For a topK up to 100, use returnValues=false and returnMetadata='indexed'
    const queryResponse = await env.VECTORIZE.query(dummyVector, {
      topK: 100,
      returnMetadata: 'indexed',
      returnValues: false
    });

    console.log('Query response:', JSON.stringify(queryResponse, null, 2));

    // Process the matches returned by the query.
    const allMetadata = queryResponse.matches
      .filter((match: any) => match.metadata)
      .map((match: any) => ({
        id: match.id,
        ...match.metadata
      }));

    // Compute some statistics (optional)
    const stats = {
      totalEntries: allMetadata.length,
      uniqueTitles: new Set(allMetadata.map((entry: any) => entry.title).filter(Boolean)).size,
      metadataFields: Array.from(
        new Set(allMetadata.flatMap((entry: any) => Object.keys(entry)))
      )
    };

    console.log('Final metadata stats:', JSON.stringify(stats, null, 2));

    return json({
      metadata: allMetadata,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error fetching metadata using query:', err);
    throw error(500, {
      message: 'Failed to fetch metadata',
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
};
