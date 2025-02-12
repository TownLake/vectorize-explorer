import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
  console.log('Metadata endpoint invoked');

  if (!platform) {
    console.error('Not running in Cloudflare Pages environment');
    throw error(500, 'Not running in Cloudflare Pages environment');
  }

  const env = platform.env;
  if (!env) {
    console.error('No environment bindings available');
    throw error(500, 'No environment bindings available');
  }

  // Read required environment variables.
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const email = env.CLOUDFLARE_EMAIL;
  const apiKey = env.CLOUDFLARE_API_KEY;
  const indexName = env.VECTORIZE_INDEX_NAME;

  if (!accountId || !email || !apiKey || !indexName) {
    console.error('Missing one or more required environment variables');
    throw error(500, 'Missing one or more required environment variables');
  }

  // Construct the Cloudflare API endpoint URL.
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/vectorize/v2/indexes/${indexName}/metadata_index/list`;
  console.log('Fetching metadata from:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        "X-Auth-Email": email,
        "X-Auth-Key": apiKey,
        "Content-Type": "application/json"
      }
    });

    console.log("Response status:", response.status, response.statusText);

    if (!response.ok) {
      const text = await response.text();
      console.error(`Error fetching metadata index: ${response.status} ${response.statusText} - ${text}`);
      throw error(500, `Error fetching metadata index: ${response.status} ${response.statusText} - ${text}`);
    }

    const data = await response.json();
    console.log("Received metadata payload:", data);

    // Expecting data.result.metadataIndexes to be an array.
    const metadataIndexes = data?.result?.metadataIndexes || [];
    const stats = {
      totalIndexes: metadataIndexes.length
    };

    return json({
      metadata: metadataIndexes,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("Error fetching metadata index:", err);
    // Log full details about the error
    console.error("Error details:", JSON.stringify(err, null, 2));
    throw error(500, {
      message: 'Failed to fetch metadata index',
      error: err?.message || JSON.stringify(err)
    });
  }
};
