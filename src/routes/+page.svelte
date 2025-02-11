<script>
	let query = '';
	let results = [];
	let metadata = [];
	let showMetadata = false;
  
	function handleSearch() {
	  // Simulate a search function (replace with real data fetching)
	  results = [
		{ title: 'Example Vector 1', score: 0.95, url: 'https://example.com/1' },
		{ title: 'Example Vector 2', score: 0.88, url: 'https://example.com/2' }
	  ];
	}
  
	function handleShowMetadata() {
	  showMetadata = !showMetadata;
	  metadata = [
		{ title: 'Metadata 1', url: 'https://example.com/meta1' },
		{ title: 'Metadata 2', url: 'https://example.com/meta2' }
	  ];
	}
  </script>
  
  <div class="w-full max-w-2xl">
	<h1 class="text-4xl text-center mb-12 text-white/90">What vectors do you need?</h1>
	
	<div class="relative w-full mb-6">
	  <input
		type="text"
		bind:value={query}
		on:keydown={(e) => e.key === 'Enter' && handleSearch()}
		placeholder="Search your vectors..."
		class="w-full p-3 pl-4 pr-12 bg-[#2a2f45] border border-white/10 rounded-lg text-white placeholder-[#ffb07c]/50 focus:outline-none focus:ring-2 focus:ring-[#ffb07c]/20 transition-all duration-300"
	  />
	  <button on:click={handleSearch} class="absolute inset-y-0 right-0 pr-4 flex items-center text-[#ffb07c]/50 hover:text-[#ffb07c]">
		🔍
	  </button>
	</div>
  
	<div class="flex justify-end mb-6 space-x-4">
	  <button on:click={handleShowMetadata} class="bg-[#2a2f45] hover:bg-[#3a3f55] text-[#ffb07c] px-6 py-3 rounded-lg transition-all duration-300">
		Show Metadata
	  </button>
	  <a href="https://github.com/TownLake/vectorize-explorer" target="_blank" class="bg-[#2a2f45] hover:bg-[#3a3f55] text-[#ffb07c] px-6 py-3 rounded-lg transition-all duration-300">
		Help
	  </a>
	</div>
  
	{#if results.length > 0}
	  <div class="bg-[#2a2f45] rounded-lg p-6 mb-6">
		<h2 class="text-lg mb-4 text-[#ffb07c]">Search Results</h2>
		<div class="space-y-4">
		  {#each results as item}
			<div class="bg-[#3a3f55] p-4 rounded-lg hover:bg-[#4a4f65]">
			  <a href={item.url} target="_blank" class="text-white/90 hover:text-[#ffb07c]">{item.title}</a>
			  <p class="text-white/60 text-sm mt-1">Score: {item.score}</p>
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
			  {#each metadata as item}
				<tr class="border-b border-white/10 last:border-b-0 hover:bg-[#3a3f55]">
				  <td class="py-3 text-white/90">{item.title}</td>
				  <td class="py-3">
					<a href={item.url} target="_blank" class="text-[#ffb07c]/70 hover:text-[#ffb07c] hover:underline">{item.url}</a>
				  </td>
				</tr>
			  {/each}
			</tbody>
		  </table>
		</div>
	  </div>
	{/if}
  </div>
  