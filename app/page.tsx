"use client";

import { useState } from "react";

// Define the type for each search result.
type SearchResult = {
  title: string;
  url: string;
  score: string;
};

// Define the type for each metadata item.
type MetadataItem = {
  title: string;
  url: string;
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [metadata, setMetadata] = useState<MetadataItem[]>([]);
  const [showMetadata, setShowMetadata] = useState(false);

  // Handle search functionality.
  const handleSearch = async () => {
    if (!query.trim()) return;
    console.log("Search triggered with query:", query);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Search error, response not OK:", errorText);
        return;
      }

      const data = (await res.json()) as SearchResult[];
      console.log("Search results:", data);
      setResults(data);
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  // Fetch metadata from the /api/metadata endpoint.
  const handleShowMetadata = async () => {
    console.log("Fetching metadata...");
    try {
      const res = await fetch("/api/metadata");
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Metadata fetch error:", errorText);
        return;
      }
      const data = (await res.json()) as MetadataItem[];
      console.log("Fetched metadata:", data);
      setMetadata(data);
      setShowMetadata(true);
    } catch (err) {
      console.error("Metadata error:", err);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 text-white">
      <div className="w-full max-w-2xl">
        {/* Title */}
        <h1 className="text-4xl font-bold text-center mb-12 text-white/90">
          What vectors do you need?
        </h1>

        {/* Search Box */}
        <div className="relative w-full mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-white/50" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search your vectors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            className="w-full p-3 pl-12 bg-[#1a1a1a] border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-300"
          />
          {query && (
            <button 
              onClick={() => setQuery("")} 
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/50 hover:text-white"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          )}
        </div>

        {/* Action Button */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={handleSearch}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-lg transition-all duration-300"
          >
            Search
          </button>
          <button
            onClick={handleShowMetadata}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-lg transition-all duration-300"
          >
            Show Metadata
          </button>
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <div className="bg-[#1a1a1a] rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-white/90">Search Results</h2>
            <div className="space-y-4">
              {results.map((item, index) => (
                <div 
                  key={index} 
                  className="bg-[#2a2a2a] p-4 rounded-lg hover:bg-[#3a3a3a] transition-colors duration-300"
                >
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/90 hover:text-white font-medium"
                  >
                    {item.title}
                  </a>
                  <p className="text-white/60 text-sm mt-1">
                    Score: {item.score}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata Table */}
        {showMetadata && metadata.length > 0 && (
          <div className="bg-[#1a1a1a] rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-white/90">Metadata</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-3 text-left text-white/60 font-medium">Title</th>
                    <th className="py-3 text-left text-white/60 font-medium">URL</th>
                  </tr>
                </thead>
                <tbody>
                  {metadata.map((item, index) => (
                    <tr 
                      key={index} 
                      className="border-b border-white/10 last:border-b-0 hover:bg-[#2a2a2a] transition-colors duration-300"
                    >
                      <td className="py-3 text-white/90">{item.title}</td>
                      <td className="py-3">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/70 hover:text-white hover:underline"
                        >
                          {item.url}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}