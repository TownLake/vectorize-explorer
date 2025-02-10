"use client";

import { useState } from "react";

type SearchResult = {
  title: string;
  url: string;
  score: string;
};

type MetadataItem = {
  title: string;
  url: string;
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [metadata, setMetadata] = useState<MetadataItem[]>([]);
  const [showMetadata, setShowMetadata] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
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
      setResults(data);
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  const handleShowMetadata = async () => {
    try {
      const res = await fetch("/api/metadata");
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Metadata fetch error:", errorText);
        return;
      }
      const data = (await res.json()) as MetadataItem[];
      setMetadata(data);
      setShowMetadata(true);
    } catch (err) {
      console.error("Metadata error:", err);
    }
  };

  return (
    <main className="min-h-screen bg-[#1a1f35] flex items-center justify-center px-4 text-white">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl text-center mb-12 text-white/90">
          What vectors do you need?
        </h1>

        <div className="relative w-full mb-6">
          <input
            type="text"
            placeholder="Search your vectors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            className="w-full p-3 pl-4 pr-12 bg-[#2a2f45] border border-white/10 rounded-lg text-white placeholder-[#ffb07c]/50 focus:outline-none focus:ring-2 focus:ring-[#ffb07c]/20 transition-all duration-300"
          />
          <button 
            onClick={handleSearch}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#ffb07c]/50 hover:text-[#ffb07c] transition-colors duration-300"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor"
            >
              <circle cx="11" cy="11" r="8" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
              <path d="M11 8v6M8 11h6" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="flex justify-end mb-6">
          <a
            href="https://github.com/TownLake/vectorize-explorer"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#2a2f45] hover:bg-[#3a3f55] text-[#ffb07c] px-6 py-3 rounded-lg transition-all duration-300"
          >
            Help
          </a>
        </div>

        {results.length > 0 && (
          <div className="bg-[#2a2f45] rounded-lg p-6 mb-6">
            <h2 className="text-lg mb-4 text-[#ffb07c]">Search Results</h2>
            <div className="space-y-4">
              {results.map((item, index) => (
                <div 
                  key={index} 
                  className="bg-[#3a3f55] p-4 rounded-lg hover:bg-[#4a4f65] transition-colors duration-300"
                >
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/90 hover:text-[#ffb07c]"
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

        {showMetadata && metadata.length > 0 && (
          <div className="bg-[#2a2f45] rounded-lg p-6">
            <h2 className="text-lg mb-4 text-[#ffb07c]">Metadata</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#ffb07c]/10">
                    <th className="py-3 text-left text-white/60">Title</th>
                    <th className="py-3 text-left text-white/60">URL</th>
                  </tr>
                </thead>
                <tbody>
                  {metadata.map((item, index) => (
                    <tr 
                      key={index} 
                      className="border-b border-white/10 last:border-b-0 hover:bg-[#3a3f55] transition-colors duration-300"
                    >
                      <td className="py-3 text-white/90">{item.title}</td>
                      <td className="py-3">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#ffb07c]/70 hover:text-[#ffb07c] hover:underline"
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