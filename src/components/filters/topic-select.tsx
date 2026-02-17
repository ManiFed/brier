"use client";

import { useState } from "react";
import { useDashboardStore } from "@/store/dashboard-store";

const COMMON_TOPICS = [
  "Politics",
  "Economics",
  "Sports",
  "Technology",
  "Science",
  "Crypto",
  "Entertainment",
  "World Events",
];

export function TopicSelect() {
  const selectedTopics = useDashboardStore((s) => s.selectedTopics);
  const setSelectedTopics = useDashboardStore((s) => s.setSelectedTopics);
  const [expanded, setExpanded] = useState(false);

  const visibleTopics = expanded ? COMMON_TOPICS : COMMON_TOPICS.slice(0, 4);

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-2 block">
        Topics
      </label>
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
      {COMMON_TOPICS.length > 4 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-[10px] text-muted-foreground hover:text-foreground"
        >
          {expanded ? "Show less" : `+${COMMON_TOPICS.length - 4} more`}
        </button>
      )}
      {selectedTopics.length > 0 && (
        <button
          onClick={() => setSelectedTopics([])}
          className="mt-1 ml-2 text-[10px] text-muted-foreground hover:text-foreground"
        >
          Clear
        </button>
      )}
    </div>
  );
}
