// src/routes/metadata/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
// Import environment variables (ensure these are set as secrets in Cloudflare Pages)
import { CLOUDFLARE_ACCOUNT_ID, VECTORIZE_INDEX_NAME, CLOUDFLARE_API_KEY } from '$env/static/private';

export const GET: RequestHandler = async ({ fetch }) => {
  // Validate that required environment variables are available.
  if (!CLOUDFLARE_ACCOUNT_ID || !VECTORIZE_INDEX_NAME || !CLOUDFLARE_API_KEY) {
    throw error(500, 'Server configuration error: Missing environment variables');
  }

  const accountId = CLOUDFLARE_ACCOUNT_ID;
  const index = VECTORIZE_INDEX_NAME;
  const token = CLOUDFLARE_API_KEY;

  const queryUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/vectorize/v2/indexes/${index}/query`;
  const getByIdsUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/vectorize/v2/indexes/${index}/get_by_ids`;

  // Create a 768-dimensional zero vector.
  const zeroVector = new Array(768).fill(0);

  // First: Query the index using the zero vector to retrieve a list of vector IDs.
  let vectorIds: string[] = [];
  try {
    const res = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vector: zeroVector,
        topK: 100,
        filter: {}
      })
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Vector query error:', text);
      throw error(res.status, 'Vector query failed');
    }

    const queryData = await res.json();
    vectorIds = queryData.result?.matches?.map((match: any) => match.id) || [];
  } catch (err) {
    console.error('Error querying vectors:', err);
    throw error(500, 'Failed to query vector ids');
  }

  // If no vector IDs are returned, send back an empty metadata array.
  if (vectorIds.length === 0) {
    return json({ metadata: [] });
  }

  // Next: Get metadata for these vector IDs.
  let metadataList: any[] = [];
  try {
    const res = await fetch(getByIdsUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids: vectorIds })
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Metadata query error:', text);
      throw error(res.status, 'Metadata query failed');
    }

    const data = await res.json();
    // Each item in data.result is expected to have a "metadata" property.
    metadataList = data.result.map((item: any) => item.metadata);
  } catch (err) {
    console.error('Error retrieving metadata:', err);
    throw error(500, 'Failed to retrieve metadata');
  }

  // Format the metadata so the UI has a propertyName and indexType.
  // Adjust the mapping based on the actual structure of your metadata.
  const formattedMetadata = metadataList.map((meta: any) => ({
    propertyName: meta.title || 'N/A',
    indexType: meta.slug ? 'blog-post' : 'unknown'
  }));

  return json({ metadata: formattedMetadata });
};
