// Server-side: routes/metadata/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface VectorizeEntry {
    id: string;
    metadata?: Record<string, any>;
}

export const GET: RequestHandler = async ({ platform }) => {
    if (!platform?.env?.VECTORIZE) {
        return new Response('Vectorize binding not found', { status: 500 });
    }

    try {
        const allMetadata: Record<string, any>[] = [];
        let cursor: string | undefined;
        let done = false;

        // Fetch all pages
        while (!done) {
            const response = await platform.env.VECTORIZE.list({
                cursor,
                limit: 100
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

        const stats = {
            totalEntries: allMetadata.length,
            uniqueTitles: new Set(allMetadata.map(entry => entry.title).filter(Boolean)).size,
            metadataFields: Array.from(new Set(allMetadata.flatMap(Object.keys)))
        };

        return json({
            metadata: allMetadata,
            stats,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error('Error fetching metadata:', err);
        return new Response(JSON.stringify({
            error: 'Failed to fetch metadata',
            details: err instanceof Error ? err.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

// Client-side: routes/+page.svelte
<script lang="ts">
    interface MetadataEntry {
        id: string;
        title?: string;
        url?: string;
        [key: string]: any;
    }

    interface MetadataStats {
        totalEntries: number;
        uniqueTitles: number;
        metadataFields: string[];
    }

    let metadata: MetadataEntry[] = [];
    let metadataStats: MetadataStats | null = null;
    let isLoading = false;
    let error: string | null = null;

    async function fetchMetadata() {
        isLoading = true;
        error = null;

        try {
            const response = await fetch('/metadata');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            metadata = data.metadata;
            metadataStats = data.stats;
        } catch (e) {
            error = e instanceof Error ? e.message : 'An error occurred';
            console.error('Error:', e);
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="min-h-screen bg-gray-900 text-white p-8">
    <div class="max-w-6xl mx-auto">
        <h1 class="text-3xl font-bold mb-8">Vectorize Metadata Explorer</h1>

        <button
            on:click={fetchMetadata}
            class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded mb-8 disabled:opacity-50"
            disabled={isLoading}
        >
            {isLoading ? 'Loading...' : 'Fetch Metadata'}
        </button>

        {#if error}
            <div class="bg-red-500/20 border border-red-500 p-4 rounded mb-8">
                {error}
            </div>
        {/if}

        {#if metadataStats}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div class="bg-gray-800 p-4 rounded">
                    <h3 class="text-lg font-semibold">Total Entries</h3>
                    <p class="text-2xl">{metadataStats.totalEntries}</p>
                </div>
                <div class="bg-gray-800 p-4 rounded">
                    <h3 class="text-lg font-semibold">Unique Titles</h3>
                    <p class="text-2xl">{metadataStats.uniqueTitles}</p>
                </div>
                <div class="bg-gray-800 p-4 rounded">
                    <h3 class="text-lg font-semibold">Metadata Fields</h3>
                    <p class="text-2xl">{metadataStats.metadataFields.length}</p>
                </div>
            </div>
        {/if}

        {#if metadata.length > 0}
            <div class="bg-gray-800 rounded-lg overflow-hidden">
                <table class="w-full">
                    <thead>
                        <tr class="bg-gray-700">
                            <th class="px-4 py-2 text-left">ID</th>
                            <th class="px-4 py-2 text-left">Title</th>
                            <th class="px-4 py-2 text-left">URL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each metadata as entry (entry.id)}
                            <tr class="border-t border-gray-700">
                                <td class="px-4 py-2">{entry.id}</td>
                                <td class="px-4 py-2">{entry.title || 'N/A'}</td>
                                <td class="px-4 py-2">
                                    {#if entry.url}
                                        <a 
                                            href={entry.url}
                                            class="text-blue-400 hover:text-blue-300"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {entry.url}
                                        </a>
                                    {:else}
                                        N/A
                                    {/if}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
</div>