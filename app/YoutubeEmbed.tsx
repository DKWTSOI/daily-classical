"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  videoId: string;
  title: string;
  searchQuery: string;
}

export default function YoutubeEmbed({ videoId, title, searchQuery }: Props) {
  const [failed, setFailed] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);

    (window as any).onYouTubeIframeAPIReady = () => {
      new (window as any).YT.Player(playerRef.current, {
        videoId,
        playerVars: { rel: 0 },
        events: {
          onError: () => setFailed(true),
        },
      });
    };

    // If API already loaded
    if ((window as any).YT?.Player) {
      (window as any).onYouTubeIframeAPIReady();
    }
  }, [videoId]);

  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;

  if (failed) {
    return (
      <a
        href={searchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-3 w-full aspect-video rounded-lg bg-stone-100 border border-stone-200 hover:bg-stone-200 transition-colors text-stone-600"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-500">
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
        </svg>
        <span className="font-medium">Search on YouTube →</span>
      </a>
    );
  }

  return (
    <div className="aspect-video w-full rounded-lg overflow-hidden shadow">
      <div ref={playerRef} className="w-full h-full" />
    </div>
  );
}
