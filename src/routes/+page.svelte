<script>
  // Define reactive variables for the input, search results, metadata, and UI state.
  let query = "";
  let results = [];
  let metadata = [];
  let showMetadata = false;

  // Dummy function to simulate a search.
  function handleSearch() {
    console.log("Searching for:", query);
    // Populate with dummy data. Replace this with your actual search logic.
    results = [
      { title: "Vector 1", url: "https://example.com/vector1", score: 0.9 },
      { title: "Vector 2", url: "https://example.com/vector2", score: 0.8 },
    ];
  }

  // Toggle metadata display and load dummy metadata if not already loaded.
  function handleShowMetadata() {
    showMetadata = !showMetadata;
    if (showMetadata && metadata.length === 0) {
      metadata = [
        { title: "Metadata 1", url: "https://example.com/meta1" },
        { title: "Metadata 2", url: "https://example.com/meta2" },
      ];
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
        on:keydown={(e) => e.key === "Enter" && handleSearch()}
        class="w-full p-3 pl-4 pr-12 bg-[#2a2f45] border border-white/10 rounded-lg text-white placeholder-[#ffb07c]/50 focus:outline-none focus:ring-2 focus:ring-[#ffb07c]/20 transition-all duration-300"
      />
      <button 
        on:click={handleSearch}
        class="absolute inset-y-0 right-0 pr-4 flex items-center text-[#ffb07c]/50 hover:text-[#ffb07c] transition-colors duration-300"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          class="h-5 w-5" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor"
        >
          <circle cx="11" cy="11" r="8" stroke-width="2"/>
          <path d="M21 21l-4.35-4.35" stroke-width="2" stroke-linecap="round"/>
          <path d="M11 8v6M8 11h6" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <div class="flex justify-end mb-6 space-x-4">
      <button
        on:click={handleShowMetadata}
        class="bg-[#2a2f45] hover:bg-[#3a3f55] text-[#ffb07c] px-6 py-3 rounded-lg transition-all duration-300"
      >
        Show Metadata
      </button>
      <a
        href="https://github.com/TownLake/vectorize-explorer"
        target="_blank"
        rel="noopener noreferrer"
        class="bg-[#2a2f45] hover:bg-[#3a3f55] text-[#ffb07c] px-6 py-3 rounded-lg transition-all duration-300"
      >
        Help
      </a>
    </div>

    {#if results.length > 0}
      <div class="bg-[#2a2f45] rounded-lg p-6 mb-6">
        <h2 class="text-lg mb-4 text-[#ffb07c]">Search Results</h2>
        <div class="space-y-4">
          {#each results as item, index}
            <div 
              key={index} 
              class="bg-[#3a3f55] p-4 rounded-lg hover:bg-[#4a4f65] transition-colors duration-300"
            >
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                class="text-white/90 hover:text-[#ffb07c]"
              >
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

    {#if showMetadata && metadata.length > 0}
      <div class="bg-[#2a2f45] rounded-lg p-6">
        <h2 class="text-lg mb-4 text-[#ffb07c]">Metadata</h2>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-[#ffb07c]/10">
                <th class="py-3 text-left text-white/60">Title</th>
                <th class="py-3 text-left text-white/60">URL</th>
              </tr>
            </thead>
            <tbody>
              {#each metadata as item, index}
                <tr 
                  key={index} 
                  class="border-b border-white/10 last:border-b-0 hover:bg-[#3a3f55] transition-colors duration-300"
                >
                  <td class="py-3 text-white/90">{item.title}</td>
                  <td class="py-3">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-[#ffb07c]/70 hover:text-[#ffb07c] hover:underline"
                    >
                      {item.url}
                    </a>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </div>
</main>
