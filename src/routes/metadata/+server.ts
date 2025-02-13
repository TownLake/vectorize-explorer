// src/routes/metadata/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  CLOUDFLARE_ACCOUNT_ID,
  VECTORIZE_INDEX_NAME,
  CLOUDFLARE_API_KEY
} from '$env/static/private';

export const GET: RequestHandler = async ({ fetch }) => {
  // Ensure required environment variables are available.
  if (!CLOUDFLARE_ACCOUNT_ID || !VECTORIZE_INDEX_NAME || !CLOUDFLARE_API_KEY) {
    console.error('Missing required environment variables');
    throw error(500, 'Missing required environment variables');
  }

  const accountId = CLOUDFLARE_ACCOUNT_ID;
  const index = VECTORIZE_INDEX_NAME;
  const token = CLOUDFLARE_API_KEY;

  const queryUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/vectorize/v2/indexes/${index}/query`;
  const getByIdsUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/vectorize/v2/indexes/${index}/get_by_ids`;

  // Create a 768-dimensional zero vector.
  const zeroVector = new Array(768).fill(0);

  // First: Query the index using the zero vector to retrieve vector IDs.
  let vectorIds: string[] = [];
  try {
    console.log('Sending vector query to:', queryUrl);
    const queryResponse = await fetch(queryUrl, {
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
    if (!queryResponse.ok) {
      const queryErrorText = await queryResponse.text();
      console.error('Vector query failed:', queryResponse.status, queryErrorText);
      throw error(queryResponse.status, `Vector query failed: ${queryResponse.statusText}`);
    }
    const queryData = await queryResponse.json();
    vectorIds = queryData.result?.matches?.map((match: any) => match.id) || [];
    console.log('Retrieved vector IDs:', vectorIds);
  } catch (err) {
    console.error('Error during vector query:', err);
    throw error(500, 'Failed to query vector ids');
  }

  if (vectorIds.length === 0) {
    console.warn('No vector IDs returned from vector query');
    return json({ metadata: [] });
  }

  // Next: Retrieve metadata for the given vector IDs.
  let metadataList: any[] = [];
  try {
    console.log('Fetching metadata for vector IDs:', vectorIds);
    const getByIdsResponse = await fetch(getByIdsUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids: vectorIds })
    });
    if (!getByIdsResponse.ok) {
      const metadataErrorText = await getByIdsResponse.text();
      console.error('Metadata query failed:', getByIdsResponse.status, metadataErrorText);
      throw error(getByIdsResponse.status, `Metadata query failed: ${getByIdsResponse.statusText}`);
    }
    const data = await getByIdsResponse.json();
    console.log('Metadata response data:', data);
    metadataList = data.result.map((item: any) => item.metadata);
  } catch (err) {
    console.error('Error during metadata query:', err);
    throw error(500, 'Failed to retrieve metadata');
  }

  return json({ metadata: metadataList });
};
