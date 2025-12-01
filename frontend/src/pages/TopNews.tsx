import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Globe2, Newspaper, Clock } from "lucide-react";
import LoadingState from "@/components/LoadingState";

type NewsArticle = {
  title: string;
  link: string;
  content?: string;
  source: string;
  source_country?: string;
  scraped_at?: string;
  description?: string;
  published_date?: string;
};

const PAGE_SIZE = 16;

const parseArticleDate = (article: NewsArticle): number => {
  // Prefer published_date from RSS, fallback to scraped_at
  const raw =
    (article.published_date && article.published_date.trim()) ||
    (article.scraped_at && article.scraped_at.trim());
  if (!raw) return 0;
  const date = new Date(raw);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
};

export default function TopNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadNews = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/news.json", {
          headers: { "Cache-Control": "no-cache" },
        });
        if (!res.ok) {
          throw new Error("Failed to load news feed");
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
          throw new Error("Invalid news format");
        }

        if (isMounted) {
          setArticles(data);
          setError(null);
        }
      } catch (e) {
        if (isMounted) {
          setError(
            e instanceof Error
              ? e.message
              : "Unable to load news at the moment."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadNews();
    return () => {
      isMounted = false;
    };
  }, []);

  const sourceFilter = (searchParams.get("source") || "").toLowerCase();
  const companyFilter = (searchParams.get("company") || "").toLowerCase();

  const filteredArticles = useMemo(() => {
    if (!sourceFilter && !companyFilter) return articles;

    return articles.filter((article) => {
      const sourceOk =
        !sourceFilter ||
        (article.source && article.source.toLowerCase().includes(sourceFilter));

      const haystack = (
        article.title +
        " " +
        (article.description || "") +
        " " +
        (article.content || "")
      ).toLowerCase();

      const companyOk =
        !companyFilter || haystack.includes(companyFilter.toLowerCase());

      return sourceOk && companyOk;
    });
  }, [articles, sourceFilter, companyFilter]);

  const visibleArticles = useMemo(() => {
    const sorted = [...filteredArticles].sort(
      (a, b) => parseArticleDate(b) - parseArticleDate(a)
    );
    return sorted.slice(0, visibleCount);
  }, [filteredArticles, visibleCount]);

  const hasMore = visibleCount < filteredArticles.length;

  // Infinite scroll using IntersectionObserver
  useEffect(() => {
    if (!loadMoreRef.current) return;
    if (!hasMore || isLoading) return;

    const target = loadMoreRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setVisibleCount((prev) =>
            Math.min(prev + PAGE_SIZE, filteredArticles.length)
          );
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
      observer.disconnect();
    };
  }, [hasMore, isLoading, filteredArticles.length]);

  if (isLoading && articles.length === 0) {
    return <LoadingState label="Loading top news..." />;
  }

  if (error && articles.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="brutal-card-lg p-8 text-center space-y-4">
          <p className="text-lg font-semibold text-destructive">
            Unable to load news feed
          </p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 space-y-10">
      <section
        className="brutal-card-lg p-8 relative overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,64,175,0.85)), url('https://images.unsplash.com/photo-1457694587812-e8bf29a43845?auto=format&fit=crop&w=1800&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.4),transparent_55%),radial-gradient(circle_at_80%_90%,rgba(34,197,94,0.35),transparent_55%)] opacity-70" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <p className="text-xs uppercase tracking-[0.5em] text-muted-foreground font-semibold">
            FinSightAi · Top News
          </p>
          <h1 className="text-display-sm md:text-display-md font-display leading-tight">
            Real-world headlines that move{" "}
            <span className="text-primary">markets</span>.
          </h1>
          <p className="text-muted-foreground text-lg font-medium max-w-2xl">
            Stream curated stories from leading business and finance publishers
            across the globe — in a single, actionable news tape.
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/60 border border-border text-xs font-semibold">
              <Globe2 className="w-4 h-4 text-primary" />
              Live from India, UK, US & more
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/60 border border-border text-xs font-semibold">
              <Newspaper className="w-4 h-4 text-secondary" />
              Times of India · Mint · CNBC · CBC · and others
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-primary" />
              Top Stories
            </h2>
            <p className="text-sm text-muted-foreground">
              Showing {visibleArticles.length} of {filteredArticles.length} articles
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleArticles.map((article, idx) => (
            <article
              key={`${article.title}-${idx}`}
              className="brutal-card bg-card/90 hover:bg-card transition-colors flex flex-col h-full overflow-hidden"
            >
              <div className="p-5 flex flex-col gap-3 flex-1">
                <div className="flex items-center justify-between gap-2 text-xs font-semibold text-muted-foreground">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted/60">
                    <Globe2 className="w-3 h-3" />
                    {article.source_country || "Global"}
                  </span>
                  <span className="uppercase tracking-[0.2em]">
                    {article.source}
                  </span>
                </div>

                <h3 className="text-lg font-bold leading-snug line-clamp-3">
                  {article.title}
                </h3>

                <p className="text-sm text-muted-foreground line-clamp-4">
                  {article.description ||
                    article.content?.slice(0, 260) ||
                    "No summary available."}
                </p>

                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.published_date ||
                      (article.scraped_at &&
                        new Date(article.scraped_at).toLocaleString()) ||
                      "Recently updated"}
                  </span>
                </div>
              </div>

              <div className="border-t border-border/60 px-5 py-3 flex items-center justify-between gap-2 bg-background/60">
                <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  External article
                </span>
                {article.link ? (
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80"
                  >
                    Read full story
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    Link unavailable
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>

        {hasMore && (
          <div ref={loadMoreRef} className="h-10 w-full" />
        )}
      </section>
    </div>
  );
}


