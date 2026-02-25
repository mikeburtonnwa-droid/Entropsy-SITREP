interface StoryCardProps {
  rank: number;
  headline: string;
  source: string;
  publishTime: string;
  briefBlock: string;
  url: string;
}

export function StoryCard({
  rank,
  headline,
  source,
  publishTime,
  briefBlock,
  url,
}: StoryCardProps) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
        <span className="font-mono text-xs font-bold text-gray-400">
          #{rank}
        </span>
        <span>{source}</span>
        <span>&middot;</span>
        <span>{publishTime}</span>
      </div>
      <h3 className="mb-3 text-lg font-semibold leading-snug">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-600"
        >
          {headline}
        </a>
      </h3>
      <div
        className="text-sm leading-relaxed text-gray-700"
        dangerouslySetInnerHTML={{ __html: briefBlock }}
      />
    </article>
  );
}
