// src/routes/+page.svelte
<script lang="ts">
    import { invalidate } from '$app/navigation';
    import type { PageData } from './$types';

    export let data: PageData;

    let isRefreshing = false;

    async function refreshData() {
        isRefreshing = true;
        try {
            await invalidate('metadata');
        } finally {
            isRefreshing = false;
        }
    }

    $: ({ metadata, stats, timestamp } = data);
</script>

<div class="min-h-screen bg-gray-900 text-white p-8">
    <div class="max-w-6xl mx-auto">
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-bold">Vectorize Metadata Explorer</h1>
            <button
                on:click={refreshData}
                class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded disabled:opacity-50 transition-colors"
                disabled={isRefreshing}
            >
                {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
        </div>

        <div class="text-sm text-gray-400 mb-8">
            Last updated: {new Date(timestamp).toLocaleString()}
        </div>

        {#if stats}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div class="bg-gray-800 p-4 rounded">
                    <h3 class="text-lg font-semibold">Total Entries</h3>
                    <p class="text-2xl">{stats.totalEntries}</p>
                </div>
                <div class="bg-gray-800 p-4 rounded">
                    <h3 class="text-lg font-semibold">Unique Titles</h3>
                    <p class="text-2xl">{stats.uniqueTitles}</p>
                </div>
                <div class="bg-gray-800 p-4 rounded">
                    <h3 class="text-lg font-semibold">Available Fields</h3>
                    <p class="text-2xl">{stats.metadataFields.length}</p>
                    <div class="mt-2 text-sm text-gray-400">
                        {stats.metadataFields.join(', ')}
                    </div>
                </div>
            </div>
        {/if}

        {#if metadata?.length > 0}
            <div class="bg-gray-800 rounded-lg overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="bg-gray-700">
                                <th class="px-4 py-2 text-left">ID</th>
                                <th class="px-4 py-2 text-left">Title</th>
                                <th class="px-4 py-2 text-left">URL</th>
                                <th class="px-4 py-2 text-left">Additional Fields</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each metadata as entry (entry.id)}
                                <tr class="border-t border-gray-700 hover:bg-gray-750">
                                    <td class="px-4 py-2 font-mono text-sm">{entry.id}</td>
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
                                    <td class="px-4 py-2">
                                        <div class="text-sm text-gray-400">
                                            {Object.entries(entry)
                                                .filter(([key]) => !['id', 'title', 'url'].includes(key))
                                                .map(([key, value]) => `${key}: ${value}`)
                                                .join(', ')}
                                        </div>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </div>
        {:else}
            <div class="text-center py-12 bg-gray-800 rounded-lg">
                <p class="text-gray-400">No metadata entries found</p>
            </div>
        {/if}
    </div>
</div>