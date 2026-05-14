import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getFeaturedNews,
  getNews,
  getNewsById,
  getUpcomingEvents,
  resolveMediaUrl,
} from "../../services/newsService";
import type { NationalEvent, NewsArticle } from "../../types/news";

const fallbackImage =
  "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=80";

function getArticleId(article: NewsArticle) {
  return String(article.id ?? article.Id ?? "");
}

function getTitle(article: NewsArticle) {
  return article.title || article.Title || "Tin tức";
}

function getSummary(article: NewsArticle) {
  return article.summary || article.Summary || article.description || article.Description || "";
}

function getContent(article: NewsArticle) {
  return article.content || article.Content || "";
}

function getCategory(article: NewsArticle) {
  return article.category || article.Category || "An ninh";
}

function getPublishedAt(article: NewsArticle) {
  return article.publishedAt || article.PublishedAt || article.createdAt || article.CreatedAt || "";
}

function getArticleImage(article: NewsArticle) {
  const image = article.thumbnailUrl || article.ThumbnailUrl || article.imageUrl || article.ImageUrl || "";
  return image ? resolveMediaUrl(image) : fallbackImage;
}

function getArticleImages(article: NewsArticle) {
  const images = article.images || article.Images || [];
  return images.map(resolveMediaUrl).filter(Boolean);
}

function formatDateTime(value: string) {
  if (!value) {
    return "Vừa cập nhật";
  }

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getEventName(event: NationalEvent) {
  return event.name || event.Name || "Sự kiện";
}

function getEventDate(event: NationalEvent) {
  return event.eventDate || event.EventDate || "";
}

function getDaysRemaining(event: NationalEvent) {
  if (typeof event.daysRemaining === "number") {
    return event.daysRemaining;
  }

  if (typeof event.DaysRemaining === "number") {
    return event.DaysRemaining;
  }

  const date = new Date(getEventDate(event));
  if (!Number.isFinite(date.getTime())) {
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((date.getTime() - today.getTime()) / 86400000));
}

function NewsSkeleton() {
  return (
    <div className="news-skeleton-grid" aria-label="Đang tải tin tức">
      {Array.from({ length: 7 }).map((_, index) => (
        <span className="news-skeleton" key={index} />
      ))}
    </div>
  );
}

interface UserNewsPageProps {
  articleId?: string;
}

function UserNewsPage({ articleId }: UserNewsPageProps) {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [featured, setFeatured] = useState<NewsArticle[]>([]);
  const [events, setEvents] = useState<NationalEvent[]>([]);
  const [detail, setDetail] = useState<NewsArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadNews() {
      await Promise.resolve();
      if (isMounted) {
        setIsLoading(true);
        setError("");
      }

      try {
        const [newsResult, featuredResult, eventResult] = await Promise.all([
          getNews(),
          getFeaturedNews(),
          getUpcomingEvents(),
        ]);

        if (!isMounted) {
          return;
        }

        setArticles(newsResult);
        setFeatured(featuredResult);
        setEvents(eventResult);
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError instanceof Error ? fetchError.message : "Không thể tải tin tức.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadNews();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!articleId) {
      return;
    }

    let isMounted = true;

    async function loadDetail() {
      await Promise.resolve();
      if (isMounted) {
        setDetailLoading(true);
      }

      try {
        const article = await getNewsById(articleId as string);
        if (isMounted) {
          setDetail(article);
        }
      } catch {
        if (isMounted) {
          setDetail(null);
        }
      } finally {
        if (isMounted) {
          setDetailLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      isMounted = false;
    };
  }, [articleId]);

  const sortedArticles = useMemo(
    () =>
      [...articles].sort(
        (first, second) => new Date(getPublishedAt(second)).getTime() - new Date(getPublishedAt(first)).getTime(),
      ),
    [articles],
  );

  const featuredArticles = useMemo(() => {
    const map = new Map<string, NewsArticle>();
    [...featured, ...sortedArticles.filter((article) => article.isFeatured || article.IsFeatured)].forEach((article) => {
      const id = getArticleId(article);
      if (id) {
        map.set(id, article);
      }
    });
    const result = Array.from(map.values());
    return result.length ? result.slice(0, 4) : sortedArticles.slice(0, 4);
  }, [featured, sortedArticles]);

  const otherArticles = useMemo(() => {
    const featuredIds = new Set(featuredArticles.map(getArticleId));
    return sortedArticles.filter((article) => !featuredIds.has(getArticleId(article)));
  }, [featuredArticles, sortedArticles]);

  const sortedEvents = useMemo(
    () => [...events].sort((first, second) => getDaysRemaining(first) - getDaysRemaining(second)),
    [events],
  );

  if (articleId) {
    const loadedDetail = detail && getArticleId(detail) === articleId ? detail : null;
    const article = loadedDetail || sortedArticles.find((item) => getArticleId(item) === articleId);
    const images = article ? getArticleImages(article) : [];

    return (
      <section className="news-detail-page">
        <button className="news-back-button" type="button" onClick={() => navigate("/user/news")}>
          ← Tin tức
        </button>
        {detailLoading ? <NewsSkeleton /> : null}
        {!detailLoading && article ? (
          <article className="news-detail-article">
            <img className="news-detail-hero" src={getArticleImage(article)} alt={getTitle(article)} />
            <div className="news-detail-meta">
              <span>{getCategory(article)}</span>
              <time>{formatDateTime(getPublishedAt(article))}</time>
            </div>
            <h2>{getTitle(article)}</h2>
            {getSummary(article) ? <p className="news-detail-summary">{getSummary(article)}</p> : null}
            <div className="news-detail-content">
              {getContent(article)
                .split(/\n{2,}|\r?\n/)
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
            </div>
            {images.length ? (
              <div className="news-detail-gallery">
                {images.map((image, index) => (
                  <img src={image} alt={`${getTitle(article)} ${index + 1}`} key={`${image}-${index}`} />
                ))}
              </div>
            ) : null}
          </article>
        ) : null}
        {!detailLoading && !article ? <div className="news-empty-state">Không tìm thấy tin tức.</div> : null}
      </section>
    );
  }

  return (
    <section className="citizen-news-page">
      <div className="page-title citizen-title">
        <p className="eyebrow">Tin tức</p>
        <h2>An ninh, cảnh báo và thông báo xã hội</h2>
        <span>Cập nhật nhanh các tin đáng chú ý trong ngày.</span>
      </div>

      {isLoading ? <NewsSkeleton /> : null}
      {error ? <div className="news-empty-state">{error}</div> : null}
      {!isLoading && !error && !sortedArticles.length ? <div className="news-empty-state">Chưa có tin tức.</div> : null}

      {!isLoading && !error && sortedArticles.length ? (
        <div className="newspaper-layout">
          <aside className="news-latest-column">
            <div className="news-column-heading">
              <span>Tin thời gian qua</span>
            </div>
            <div className="news-latest-list">
              {otherArticles.map((article) => (
                <Link className="news-latest-item" to={`/user/news/${getArticleId(article)}`} key={getArticleId(article)}>
                  <img src={getArticleImage(article)} alt={getTitle(article)} />
                  <span>
                    <strong>{getTitle(article)}</strong>
                    <small>{getCategory(article)} · {formatDateTime(getPublishedAt(article))}</small>
                  </span>
                </Link>
              ))}
              {!otherArticles.length ? <div className="news-empty-state compact">Chưa có tin khác.</div> : null}
            </div>
          </aside>

          <section className="news-featured-column">
            <div className="news-column-heading">
              <span>Tin nổi bật</span>
            </div>
            {featuredArticles[0] ? (
              <Link className="news-lead-story" to={`/user/news/${getArticleId(featuredArticles[0])}`}>
                <img src={getArticleImage(featuredArticles[0])} alt={getTitle(featuredArticles[0])} />
                <span className="news-kicker">{getCategory(featuredArticles[0])}</span>
                <h3>{getTitle(featuredArticles[0])}</h3>
                <p>{getSummary(featuredArticles[0])}</p>
                <time>{formatDateTime(getPublishedAt(featuredArticles[0]))}</time>
              </Link>
            ) : null}
            <div className="news-secondary-grid">
              {featuredArticles.slice(1, 4).map((article) => (
                <Link className="news-secondary-story" to={`/user/news/${getArticleId(article)}`} key={getArticleId(article)}>
                  <img src={getArticleImage(article)} alt={getTitle(article)} />
                  <strong>{getTitle(article)}</strong>
                  <time>{formatDateTime(getPublishedAt(article))}</time>
                </Link>
              ))}
            </div>
          </section>

          <aside className="news-events-column">
            <div className="news-column-heading">
              <span>Sự kiện Việt Nam</span>
            </div>
            <div className="national-event-list">
              {sortedEvents.map((event) => (
                <article className="national-event-card" key={`${getEventName(event)}-${getEventDate(event)}`}>
                  <span>{getDaysRemaining(event)}</span>
                  <div>
                    <strong>{getEventName(event)}</strong>
                    <small>{formatDateTime(getEventDate(event)).replace(" lúc 00:00", "")}</small>
                    <em>Còn {getDaysRemaining(event)} ngày</em>
                  </div>
                </article>
              ))}
              {!sortedEvents.length ? <div className="news-empty-state compact">Chưa có sự kiện sắp tới.</div> : null}
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}

export default UserNewsPage;
