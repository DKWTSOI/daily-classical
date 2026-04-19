export default function Home() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900 flex flex-col items-center justify-start px-6 py-16">
      <article className="max-w-xl w-full space-y-8">
        <header className="space-y-1">
          <p className="text-sm tracking-widest uppercase text-stone-400">
            Johann Sebastian Bach · 1741
          </p>
          <h1 className="text-4xl font-serif font-semibold">
            Goldberg Variations
          </h1>
          <p className="text-stone-500 text-sm">BWV 988</p>
        </header>

        <div className="aspect-video w-full rounded-lg overflow-hidden shadow">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/Ah392lnFHxM"
            title="Glenn Gould — Goldberg Variations (1981)"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <p className="text-stone-500 text-xs text-center">
          Glenn Gould · 1981 recording
        </p>

        <p className="leading-relaxed text-stone-700">
          {/* Replace this placeholder with your paragraph */}
          Your paragraph goes here. Describe what this piece means to you, how
          you discovered it, or why Glenn Gould&apos;s 1981 recording stands
          apart from every other interpretation.
        </p>
      </article>
    </main>
  );
}
