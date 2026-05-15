import { useEffect, useMemo, useState, type CSSProperties } from "react";
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

const eventImages: Record<string, string> = {
  "Ngày Giáng sinh": "/event-images/giang-sinh.png",
  "Ngày Giải phóng miền Nam, thống nhất đất nước": "/event-images/giai-phong-mien-nam.png",
  "Ngày Quốc khánh nước Cộng hòa Xã hội Chủ nghĩa Việt Nam": "/event-images/quoc-khanh-vn.png",
  "Ngày Quốc tế Lao động": "/event-images/quoc-te-lao-dong.png",
  "Giỗ Tổ Hùng Vương": "/event-images/gio-to-hung-vuong.png",
  "Tết Dương Lịch": "/event-images/tet-duong-lich.png",
  "Tết Nguyên Đán": "/event-images/tet-nguyen-dan.png",
};

const eventImageAliases: Record<string, string> = {
  christmas: "/event-images/giang-sinh.png",
  "giai phong mien nam": "/event-images/giai-phong-mien-nam.png",
  "giang sinh": "/event-images/giang-sinh.png",
  "gio to hung vuong": "/event-images/gio-to-hung-vuong.png",
  "hung vuong": "/event-images/gio-to-hung-vuong.png",
  "image:giang-sinh": "/event-images/giang-sinh.png",
  "image:giai-phong-mien-nam": "/event-images/giai-phong-mien-nam.png",
  "image:gio-to-hung-vuong": "/event-images/gio-to-hung-vuong.png",
  "image:quoc-khanh-vn": "/event-images/quoc-khanh-vn.png",
  "image:quoc-te-lao-dong": "/event-images/quoc-te-lao-dong.png",
  "image:tet-duong-lich": "/event-images/tet-duong-lich.png",
  "image:tet-nguyen-dan": "/event-images/tet-nguyen-dan.png",
  noel: "/event-images/giang-sinh.png",
  "ngay giai phong mien nam thong nhat dat nuoc": "/event-images/giai-phong-mien-nam.png",
  "ngay giang sinh": "/event-images/giang-sinh.png",
  "ngay quoc khanh nuoc cong hoa xa hoi chu nghia viet nam": "/event-images/quoc-khanh-vn.png",
  "ngay quoc te lao dong": "/event-images/quoc-te-lao-dong.png",
  "quoc khanh": "/event-images/quoc-khanh-vn.png",
  "quoc te lao dong": "/event-images/quoc-te-lao-dong.png",
  "tet duong lich": "/event-images/tet-duong-lich.png",
  "tet nguyen dan": "/event-images/tet-nguyen-dan.png",
};

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

function getEventId(event: NationalEvent) {
  return String(event.id ?? event.Id ?? `${getEventName(event)}-${getEventDate(event)}`);
}

function normalizeEventName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getEventImage(event: NationalEvent) {
  const source = event as Record<string, unknown>;
  const imageKey = source.imageKey || source.ImageKey;
  if (typeof imageKey === "string" && imageKey.trim()) {
    const key = `image:${normalizeEventName(imageKey).replace(/\.(png|jpg|jpeg|webp)$/i, "")}`;
    const image = eventImageAliases[key] || eventImageAliases[normalizeEventName(imageKey)];
    if (image) {
      return image;
    }
  }

  const name = getEventName(event);
  const exactImage = eventImages[name];
  if (exactImage) {
    return exactImage;
  }

  const normalizedName = normalizeEventName(name);
  const aliasImage = eventImageAliases[normalizedName];
  if (aliasImage) {
    return aliasImage;
  }

  const matchedEntry = Object.entries(eventImages).find(([eventName]) =>
    normalizedName.includes(normalizeEventName(eventName)) || normalizeEventName(eventName).includes(normalizedName),
  );
  return matchedEntry?.[1] || "";
}

function getEventDescription(event: NationalEvent) {
  const source = event as Record<string, unknown>;
  const description = source.description || source.Description || source.summary || source.Summary;
  return typeof description === "string" ? description : "";
}

function getEventCardStyle(event: NationalEvent): CSSProperties {
  const image = getEventImage(event);
  return image ? ({ "--event-image": `url("${image}")` } as CSSProperties) : {};
}

function getEventVisualClass(event: NationalEvent) {
  const name = getEventName(event).toLowerCase();
  if (name.includes("noel") || name.includes("giáng sinh") || name.includes("christmas")) {
    return "is-christmas";
  }
  if (name.includes("tết") || name.includes("nguyên đán") || name.includes("lunar")) {
    return "is-tet";
  }
  if (name.includes("quốc khánh") || name.includes("2/9") || name.includes("độc lập")) {
    return "is-national-day";
  }
  if (name.includes("trung thu") || name.includes("mid-autumn") || name.includes("trăng")) {
    return "is-mid-autumn";
  }

  return "is-cultural";
}

function toStartOfDay(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function getDaysRemaining(event: NationalEvent) {
  if (typeof event.daysRemaining === "number") {
    return event.daysRemaining;
  }

  if (typeof event.DaysRemaining === "number") {
    return event.DaysRemaining;
  }

  const date = toStartOfDay(getEventDate(event));
  if (!date) {
    return 0;
  }

  const today = toStartOfDay(new Date()) as Date;
  return Math.max(0, Math.ceil((date.getTime() - today.getTime()) / 86400000));
}

function isEventToday(event: NationalEvent) {
  const date = toStartOfDay(getEventDate(event));
  const today = toStartOfDay(new Date());
  return Boolean(date && today && date.getTime() === today.getTime());
}

function isUpcomingEvent(event: NationalEvent) {
  const date = toStartOfDay(getEventDate(event));
  const today = toStartOfDay(new Date());
  return Boolean(date && today && date.getTime() > today.getTime());
}

function formatEventDate(value: string) {
  if (!value) {
    return "Chưa có ngày diễn ra";
  }

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatCurrentClock(value: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
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

function NewsLeadPlaceholder({ isLoading }: { isLoading: boolean }) {
  return (
    <article className={`news-lead-story news-placeholder-card ${isLoading ? "is-loading" : ""}`}>
      <span className="news-placeholder-image" />
      <span className="news-kicker">{isLoading ? "Đang tải" : "Tin nổi bật"}</span>
      <h3>{isLoading ? "Đang tải tin nổi bật..." : "Chưa có tin nổi bật"}</h3>
      <p>{isLoading ? "Hệ thống đang lấy dữ liệu mới nhất." : "Tin nổi bật sẽ xuất hiện tại đây khi được xuất bản."}</p>
      <time>{isLoading ? "Vui lòng chờ" : "Chưa có thời gian đăng"}</time>
    </article>
  );
}

function NewsSmallPlaceholder({ index, isLoading }: { index: number; isLoading: boolean }) {
  return (
    <article className={`news-secondary-story news-placeholder-card ${isLoading ? "is-loading" : ""}`}>
      <span className="news-placeholder-image" />
      <strong>{isLoading ? "Đang tải tin..." : `Khung tin nổi bật ${index}`}</strong>
      <time>{isLoading ? "Đang cập nhật" : "Chưa có dữ liệu"}</time>
    </article>
  );
}

function LatestPlaceholder({ index, isLoading }: { index: number; isLoading: boolean }) {
  return (
    <article className={`news-latest-item news-placeholder-card ${isLoading ? "is-loading" : ""}`}>
      <span className="news-latest-dot" aria-hidden="true" />
      <span className="news-latest-copy">
        <strong>{isLoading ? "Đang tải bản tin..." : `Vị trí tin thời gian qua ${index}`}</strong>
        <small>{isLoading ? "Đang cập nhật" : "Chưa có tin tức."}</small>
      </span>
    </article>
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
  const [currentClock, setCurrentClock] = useState(() => new Date());

  useEffect(() => {
    let isMounted = true;

    async function loadNews() {
      await Promise.resolve();
      if (isMounted) {
        setIsLoading(true);
        setError("");
      }

      const [newsResult, featuredResult, eventResult] = await Promise.allSettled([
        getNews(),
        getFeaturedNews(),
        getUpcomingEvents(),
      ]);

      if (!isMounted) {
        return;
      }

      if (newsResult.status === "fulfilled") {
        setArticles(newsResult.value);
      }

      if (featuredResult.status === "fulfilled") {
        setFeatured(featuredResult.value);
      }

      if (eventResult.status === "fulfilled") {
        setEvents(eventResult.value);
      }

      if (newsResult.status === "rejected" || featuredResult.status === "rejected") {
        setError("Không thể tải đầy đủ tin tức. Bố cục vẫn được giữ để theo dõi sự kiện.");
      }

      setIsLoading(false);
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
    () =>
      [...events].sort((first, second) => {
        const firstDate = toStartOfDay(getEventDate(first));
        const secondDate = toStartOfDay(getEventDate(second));
        return (firstDate?.getTime() || 0) - (secondDate?.getTime() || 0);
      }),
    [events],
  );

  const todayEvents = useMemo(() => sortedEvents.filter(isEventToday), [sortedEvents]);

  const upcomingEvents = useMemo(
    () => sortedEvents.filter(isUpcomingEvent).slice(0, 3),
    [sortedEvents],
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentClock(new Date()), 30000);
    return () => window.clearInterval(intervalId);
  }, []);

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

      {error ? <div className="news-empty-state">{error}</div> : null}

      <div className="newspaper-layout">
        <aside className="news-latest-column">
          <div className="news-column-heading">
            <span>Tin thời gian qua</span>
          </div>
          <div className="news-latest-list">
            {otherArticles.length
              ? otherArticles.map((article) => (
                  <Link className="news-latest-item" to={`/user/news/${getArticleId(article)}`} key={getArticleId(article)}>
                    <span className="news-latest-dot" aria-hidden="true" />
                    <span className="news-latest-copy">
                      <strong>{getTitle(article)}</strong>
                      <small>
                        <time>{formatDateTime(getPublishedAt(article))}</time>
                        <em>{getCategory(article)}</em>
                      </small>
                    </span>
                  </Link>
                ))
              : Array.from({ length: 6 }).map((_, index) => (
                  <LatestPlaceholder index={index + 1} isLoading={isLoading} key={index} />
                ))}
          </div>
          <div className="news-left-filler">
            <span>Nhịp tin trong ngày</span>
            <strong>{sortedArticles.length}</strong>
            <small>{featuredArticles.length} tin nổi bật, {otherArticles.length} tin mới đang theo dõi.</small>
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
          ) : (
            <NewsLeadPlaceholder isLoading={isLoading} />
          )}
          <div className="news-secondary-grid">
            {Array.from({ length: 3 }).map((_, index) => {
              const article = featuredArticles[index + 1];

              return article ? (
                <Link className="news-secondary-story" to={`/user/news/${getArticleId(article)}`} key={getArticleId(article)}>
                  <img src={getArticleImage(article)} alt={getTitle(article)} />
                  <strong>{getTitle(article)}</strong>
                  <time>{formatDateTime(getPublishedAt(article))}</time>
                </Link>
              ) : (
                <NewsSmallPlaceholder index={index + 2} isLoading={isLoading} key={index} />
              );
            })}
          </div>
        </section>

        <aside className="news-events-column">
          <div className="news-side-section news-clock-section">
            <span>Thời gian hiện tại</span>
            <strong>{formatCurrentClock(currentClock)}</strong>
          </div>

          <div className="news-side-section news-event-section">
            <div className="news-column-heading">
              <span>Sự kiện Việt Nam</span>
            </div>
            <div className="national-event-groups">
              <section className="national-event-group">
                <div className="national-event-group-heading">
                  <span>Hôm nay</span>
                </div>
                {todayEvents.length ? (
                  todayEvents.map((event) => (
                    <article
                      className={`national-event-card is-today ${getEventVisualClass(event)}`}
                      key={getEventId(event)}
                      style={getEventCardStyle(event)}
                    >
                      <div className="national-event-content">
                        <span className="national-event-countdown">Hôm nay</span>
                        <strong>{getEventName(event)}</strong>
                        <small>{formatEventDate(getEventDate(event))}</small>
                        {getEventDescription(event) ? <p>{getEventDescription(event)}</p> : null}
                        <em>Hôm nay</em>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className={`national-event-empty ${isLoading ? "is-loading news-placeholder-card" : ""}`}>
                    <strong>{isLoading ? "Đang tải sự kiện..." : "Hôm nay không có sự kiện quan trọng"}</strong>
                    <small>{isLoading ? "Đang kiểm tra lịch sự kiện Việt Nam" : "Các sự kiện gần nhất nằm ở nhóm Sắp tới."}</small>
                  </div>
                )}
              </section>

              <section className="national-event-group">
                <div className="national-event-group-heading">
                  <span>Sắp tới</span>
                </div>
                <div className="national-event-list">
                  {upcomingEvents.length
                    ? upcomingEvents.map((event) => {
                        const daysRemaining = getDaysRemaining(event);

                        return (
                          <article
                            className={`national-event-card is-upcoming ${getEventVisualClass(event)}`}
                            key={getEventId(event)}
                            style={getEventCardStyle(event)}
                          >
                            <div className="national-event-content">
                              <strong>{getEventName(event)}</strong>
                              <small>{formatEventDate(getEventDate(event))}</small>
                              <em>{daysRemaining === 0 ? "Hôm nay" : `Còn ${daysRemaining} ngày`}</em>
                            </div>
                          </article>
                        );
                      })
                    : Array.from({ length: isLoading ? 2 : 1 }).map((_, index) => (
                        <article className={`national-event-card is-upcoming news-placeholder-card ${isLoading ? "is-loading" : ""}`} key={index}>
                          <div className="national-event-content">
                            <strong>{isLoading ? "Đang tải sự kiện..." : "Chưa có sự kiện sắp tới"}</strong>
                            <small>{isLoading ? "Đang cập nhật ngày diễn ra" : "API chưa trả dữ liệu sự kiện."}</small>
                            <em>{isLoading ? "Đang tính countdown" : "Còn -- ngày"}</em>
                          </div>
                        </article>
                      ))}
                </div>
              </section>
            </div>
          </div>

        </aside>
      </div>
    </section>
  );
}

export default UserNewsPage;
