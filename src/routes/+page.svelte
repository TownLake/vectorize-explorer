<script lang="ts">
  interface MetadataEntry {
    id: string;
    title?: string;
    slug?: string;
    url?: string;
    [key: string]: any;  // Allow for additional metadata fields
  }

  interface MetadataStats {
    totalEntries: number;
    uniqueTitles: number;
    metadataFields: string[];
  }

  let query: string = '';
  let results: { title: string; url: string; score: number | string }[] = [];
  let showMetadata: boolean = false;
  let metadata: MetadataEntry[] = [];
  let metadataStats: MetadataStats | null = null;
  let isLoadingMetadata: boolean = false;
  let metadataError: string | null = null;

  async function handleSearch() {
    try {
      const response = await fetch('/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        const err = await response.json();
        console.error('Search error:', err);
        results = [];
        return;
      }

      results = await response.json();
    } catch (error) {
      console.error('Error fetching search results:', error);
      results = [];
    }
  }

  async function handleShowMetadata() {
    showMetadata = !showMetadata;
    
    if (showMetadata) {
      isLoadingMetadata = true;
      metadataError = null;
      
      try {
        const response = await fetch('/metadata');
        if (!response.ok) {
          throw new Error('Failed to fetch metadata');
        }
        
        const data = await response.json();
        metadata = data.metadata.map((entry: MetadataEntry) => ({
          ...entry,
          url: entry.slug ? `https://blog.samrhea.com${entry.slug}` : '#'
        }));
        metadataStats = data.stats;
      } catch (error) {
        console.error('Error fetching metadata:', error);
        metadataError = 'Failed to load metadata';
        metadata = [];
        metadataStats = null;
      } finally {
        isLoadingMetadata = false;
      }
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }
</script>

<main class="min-h-screen bg-[#1a1f35] flex items-center justify-center px-4 text-white">
  <div class="w-full max-w-2xl">
    <h1 class="text-4xl text-center mb-12 text-white/90">
      What vectors do you need?
    </h1>

    <div class="relative w-full mb-6">
      <input
        type="text"
        placeholder="Search your vectors..."
        bind:value={query}
        on:keydown={onKeyDown}
        class="w-full p-3 pl-4 pr-12 bg-[#2a2f45] border border-white/10 rounded-lg text-white placeholder-[#ffb07c]/50 focus:outline-none focus:ring-2 focus:ring-[#ffb07c]/20 transition-all duration-300"
      />
      <button 
        on:click={handleSearch}
        class="absolute inset-y-0 right-0 pr-4 flex items-center text-[#ffb07c]/50 hover:text-[#ffb07c] transition-colors duration-300">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          class="h-5 w-5" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor">
          <circle cx="11" cy="11" r="8" stroke-width="2" />
          <path d="M21 21l-4.35-4.35" stroke-width="2" stroke-linecap="round" />
          <path d="M11 8v6M8 11h6" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
    </div>

    <div class="flex justify-end mb-6 space-x-4">
      <button
        on:click={handleShowMetadata}
        class="bg-[#2a2f45] hover:bg-[#3a3f55] text-[#ffb07c] px-6 py-3 rounded-lg transition-all duration-300 flex items-center">
        {#if isLoadingMetadata}
          <svg class="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
        {/if}
        {showMetadata ? 'Hide' : 'Show'} Metadata
      </button>
      <a
        href="https://github.com/TownLake/vectorize-explorer"
        target="_blank"
        rel="noopener noreferrer"
        class="bg-[#2a2f45] hover:bg-[#3a3f55] text-[#ffb07c] px-6 py-3 rounded-lg transition-all duration-300">
        Help
      </a>
    </div>

    {#if results.length > 0}
      <div class="bg-[#2a2f45] rounded-lg p-6 mb-6">
        <h2 class="text-lg mb-4 text-[#ffb07c]">Search Results</h2>
        <div class="space-y-4">
          {#each results as item, index (index)}
            <div class="bg-[#3a3f55] p-4 rounded-lg hover:bg-[#4a4f65] transition-colors duration-300">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                class="text-white/90 hover:text-[#ffb07c]">
                {item.title}
              </a>
              <p class="text-white/60 text-sm mt-1">
                Score: {item.score}
              </p>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if showMetadata}
      <div class="bg-[#2a2f45] rounded-lg p-6">
        <h2 class="text-lg mb-4 text-[#ffb07c]">Metadata</h2>
        
        {#if metadataError}
          <div class="text-red-400 mb-4">
            {metadataError}
          </div>
        {:else if isLoadingMetadata}
          <div class="flex justify-center py-8">
            <svg class="animate-spin h-8 w-8 text-[#ffb07c]" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          </div>
        {:else}
          {#if metadataStats}
            <div class="mb-6 grid grid-cols-3 gap-4">
              <div class="bg-[#3a3f55] p-4 rounded-lg">
                <p class="text-white/60 text-sm">Total Entries</p>
                <p class="text-2xl text-[#ffb07c]">{metadataStats.totalEntries}</p>
              </div>
              <div class="bg-[#3a3f55] p-4 rounded-lg">
                <p class="text-white/60 text-sm">Unique Titles</p>
                <p class="text-2xl text-[#ffb07c]">{metadataStats.uniqueTitles}</p>
              </div>
              <div class="bg-[#3a3f55] p-4 rounded-lg">
                <p class="text-white/60 text-sm">Fields</p>
                <p class="text-2xl text-[#ffb07c]">{metadataStats.metadataFields.length}</p>
              </div>
            </div>
          {/if}

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-[#ffb07c]/10">
                  <th class="py-3 text-left text-white/60">ID</th>
                  <th class="py-3 text-left text-white/60">Title</th>
                  <th class="py-3 text-left text-white/60">URL</th>
                </tr>
              </thead>
              <tbody>
                {#each metadata as item, index (item.id)}
                  <tr class="border-b border-white/10 last:border-b-0 hover:bg-[#3a3f55] transition-colors duration-300">
                    <td class="py-3 text-white/60">{item.id}</td>
                    <td class="py-3 text-white/90">{item.title || 'N/A'}</td>
                    <td class="py-3">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-[#ffb07c]/70 hover:text-[#ffb07c] hover:underline">
                        {item.url}
                      </a>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</main>