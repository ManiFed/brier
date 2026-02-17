"use client";

import { useEffect, useMemo, useState } from "react";
import { useDashboardStore } from "@/store/dashboard-store";

const COMMON_TOPICS = [
  "Politics",
  "Elections",
  "Economics",
  "Inflation",
  "Technology",
  "AI",
  "Science",
  "Climate",
  "Space",
  "Crypto",
  "Sports",
  "Geopolitics",
  "Healthcare",
  "Energy",
  "Entertainment",
  "World Events",
];

export function TopicSelect() {
  const selectedTopics = useDashboardStore((s) => s.selectedTopics);
  const setSelectedTopics = useDashboardStore((s) => s.setSelectedTopics);
  const [expanded, setExpanded] = useState(false);
  const [apiTopics, setApiTopics] = useState<string[]>([]);

  useEffect(() => {
    const run = async () => {
      const response = await fetch("/api/filter-options");
      if (!response.ok) return;
      const data = (await response.json()) as { topics?: string[] };
      setApiTopics(data.topics ?? []);
    };
    run();
  }, []);

  const mergedTopics = useMemo(() => {
    return [...new Set([...COMMON_TOPICS, ...apiTopics])];
  }, [apiTopics]);

  const visibleTopics = expanded ? mergedTopics : mergedTopics.slice(0, 8);

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-2 block">Topics</label>
      <div className="flex flex-wrap gap-1">
        {visibleTopics.map((topic) => {
          const selected = selectedTopics.includes(topic);
          return (
            <button
              key={topic}
              onClick={() => toggleTopic(topic)}
              className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                selected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {topic}
            </button>
          );
        })}
      </div>
      {mergedTopics.length > 8 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-[10px] text-muted-foreground hover:text-foreground"
        >
          {expanded ? "Show less" : `+${mergedTopics.length - 8} more`}
        </button>
      )}
    </div>
  );
}
