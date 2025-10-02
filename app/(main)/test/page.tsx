"use client";

import React, { useState } from "react";

interface Career {
  title: string;
  industry: string;
  keySkills: string[];
  avgSalary: { currency: string; low: number; high: number };
  growthRate: string;
  demandLevel: string;
  description: string;
  sources: string[];
}

const CareerExplorer: React.FC = () => {
  const [query, setQuery] = useState("");
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCareers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/careers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data: Career[] = await res.json();
      setCareers(data);
    } catch (err) {
      console.error("Error fetching careers:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Search Box */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search careers by skill, industry, or title..."
          className="border px-3 py-2 w-full rounded-md"
        />
        <button
          onClick={fetchCareers}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          {loading ? "Loading..." : "Search"}
        </button>
      </div>

      {/* Results */}
      {careers.length > 0 && (
        <div className="grid gap-4">
          {careers.map((career, idx) => (
            <div
              key={idx}
              className="border p-4 rounded-lg shadow bg-white dark:bg-gray-800"
            >
              <h2 className="text-xl font-semibold">{career.title}</h2>
              <p className="text-gray-600">{career.industry}</p>
              <p className="mt-2">
                <strong>Salary:</strong> {career.avgSalary.currency}{" "}
                {career.avgSalary.low.toLocaleString()} -{" "}
                {career.avgSalary.high.toLocaleString()}
              </p>
              <p>
                <strong>Growth:</strong> {career.growthRate}
              </p>
              <p>
                <strong>Demand:</strong> {career.demandLevel}
              </p>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                {career.description}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                <strong>Skills:</strong> {career.keySkills.join(", ")}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                <strong>Sources:</strong> {career.sources.join(", ")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CareerExplorer;
