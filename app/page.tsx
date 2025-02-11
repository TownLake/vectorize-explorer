// app/page.tsx
"use client";

import { useState } from "react";

type SearchResult = {
  title: string;
  url: string;
  score: string;
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

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

  return (
    <main className="min-h-screen bg-[#1a1f35] flex items-center justify-center px-4 text-white">
      {/* ... your UI markup ... */}
      <input
        type="text"
        placeholder="Search your vectors..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSearch();
        }}
        /* other props and classes */
      />
      <button onClick={handleSearch}>
        {/* search icon SVG */}
      </button>
      {/* display search results */}
      {results.length > 0 && (
        <div>
          <h2>Search Results</h2>
          {results.map((item, index) => (
            <div key={index}>
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                {item.title}
              </a>
              <p>Score: {item.score}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
