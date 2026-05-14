import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createSupportNews,
  deleteSupportNews,
  getSupportNews,
  resolveMediaUrl,
  updateSupportNews,
  updateSupportNewsFeatured,
  updateSupportNewsStatus,
} from "../../services/newsService";
import type { NewsArticle, NewsPayload } from "../../types/news";

const emptyForm: NewsPayload = {
  category: "An ninh",
  content: "",
  featuredOrder: null,
  isFeatured: false,
  summary: "",
  thumbnailUrl: "",
  title: "",
};

function getArticleId(article: NewsArticle) {
  return String(article.id ?? article.Id ?? "");
}

function getTitle(article: NewsArticle) {
  return article.title || article.Title || "Tin tức";
}

function getStatus(article: NewsArticle) {
  return article.status || article.Status || "draft";
}

function getFeaturedOrder(article: NewsArticle) {
  return article.featuredOrder ?? article.FeaturedOrder ?? null;
}

function getThumbnail(article: NewsArticle) {
  const url = article.thumbnailUrl || article.ThumbnailUrl || article.imageUrl || article.ImageUrl || "";
  return url ? resolveMediaUrl(url) : "";
}

function getDate(article: NewsArticle) {
  return article.publishedAt || article.PublishedAt || article.createdAt || article.CreatedAt || article.updatedAt || article.UpdatedAt || "";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return value || "Chưa đăng";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function buildFormFromArticle(article: NewsArticle): NewsPayload {
  return {
    category: article.category || article.Category || "",
    content: article.content || article.Content || "",
    featuredOrder: getFeaturedOrder(article),
    isFeatured: Boolean(article.isFeatured || article.IsFeatured),
    summary: article.summary || article.Summary || article.description || article.Description || "",
    thumbnailUrl: article.thumbnailUrl || article.ThumbnailUrl || article.imageUrl || article.ImageUrl || "",
    title: getTitle(article),
  };
}

function SupportNewsManager() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [form, setForm] = useState<NewsPayload>(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const sortedArticles = useMemo(
    () => [...articles].sort((first, second) => new Date(getDate(second)).getTime() - new Date(getDate(first)).getTime()),
    [articles],
  );

  useEffect(() => {
    reloadNews();
  }, []);

  function reloadNews() {
    setIsLoading(true);
    getSupportNews()
      .then(setArticles)
      .catch((error) => setMessage(error instanceof Error ? error.message : "Không thể tải tin tức."))
      .finally(() => setIsLoading(false));
  }

  function resetForm(clearMessage = true) {
    setEditingId("");
    setForm(emptyForm);
    if (clearMessage) {
      setMessage("");
    }
  }

  function updateField<Key extends keyof NewsPayload>(key: Key, value: NewsPayload[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!form.title.trim()) {
      setMessage("Vui lòng nhập tiêu đề.");
      return;
    }

    if (!form.content.trim()) {
      setMessage("Vui lòng nhập nội dung.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      ...form,
      featuredOrder: form.isFeatured ? form.featuredOrder || 1 : null,
    };

    try {
      if (editingId) {
        await updateSupportNews(editingId, payload);
        setMessage("Đã cập nhật tin tức.");
      } else {
        await createSupportNews(payload);
        setMessage("Đã tạo tin tức.");
      }
      resetForm(false);
      reloadNews();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể lưu tin tức.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatus(id: string, status: string) {
    try {
      await updateSupportNewsStatus(id, status);
      reloadNews();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể đổi trạng thái.");
    }
  }

  async function handleFeatured(article: NewsArticle) {
    const id = getArticleId(article);
    const nextFeatured = !(article.isFeatured || article.IsFeatured);
    const nextOrder = nextFeatured ? getFeaturedOrder(article) || 1 : null;

    try {
      await updateSupportNewsFeatured(id, nextFeatured, nextOrder);
      reloadNews();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể cập nhật tin nổi bật.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Bạn có chắc muốn xóa tin này không?")) {
      return;
    }

    try {
      await deleteSupportNews(id);
      if (editingId === id) {
        resetForm();
      }
      reloadNews();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể xóa tin tức.");
    }
  }

  return (
    <>
      <section className="page-title support-title">
        <p className="eyebrow">Tin tức</p>
        <h2>Quản lý bản tin người dân</h2>
        <span>Tạo, chỉnh sửa, publish và sắp xếp tin nổi bật thật nhanh.</span>
      </section>

      <section className="support-news-workspace">
        <form className="panel support-news-form" onSubmit={handleSubmit}>
          <div className="section-heading support-news-form-heading">
            <div>
              <span className="eyebrow">{editingId ? "Chỉnh sửa" : "Tạo tin"}</span>
              <h2>{editingId ? "Cập nhật bài viết" : "Bài viết mới"}</h2>
            </div>
            {editingId ? (
              <button className="btn btn-ghost" type="button" onClick={() => resetForm()}>
                Hủy
              </button>
            ) : null}
          </div>

          <label className="field" htmlFor="news-title">
            <span>Tiêu đề</span>
            <input id="news-title" value={form.title} onChange={(event) => updateField("title", event.target.value)} />
          </label>

          <label className="field" htmlFor="news-summary">
            <span>Mô tả ngắn</span>
            <textarea
              id="news-summary"
              rows={3}
              value={form.summary}
              onChange={(event) => updateField("summary", event.target.value)}
            />
          </label>

          <label className="field" htmlFor="news-content">
            <span>Nội dung</span>
            <textarea
              id="news-content"
              rows={9}
              value={form.content}
              onChange={(event) => updateField("content", event.target.value)}
            />
          </label>

          <div className="support-news-field-row">
            <label className="field" htmlFor="news-thumbnail">
              <span>Thumbnail image</span>
              <input
                id="news-thumbnail"
                placeholder="https://..."
                value={form.thumbnailUrl}
                onChange={(event) => updateField("thumbnailUrl", event.target.value)}
              />
            </label>

            <label className="field" htmlFor="news-category">
              <span>Category</span>
              <input
                id="news-category"
                value={form.category}
                onChange={(event) => updateField("category", event.target.value)}
              />
            </label>
          </div>

          <div className="support-news-featured-controls">
            <label className="support-news-checkbox">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) => updateField("isFeatured", event.target.checked)}
              />
              <span>Tin nổi bật</span>
            </label>

            {form.isFeatured ? (
              <label className="field" htmlFor="featured-order">
                <span>Thứ tự</span>
                <select
                  id="featured-order"
                  value={form.featuredOrder || 1}
                  onChange={(event) => updateField("featuredOrder", Number(event.target.value))}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </label>
            ) : null}
          </div>

          <button className="btn btn-primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Tạo tin"}
          </button>
          {message ? <span className="form-message">{message}</span> : null}
        </form>

        <section className="panel support-news-list-panel">
          <div className="section-heading support-panel-heading">
            <div>
              <span className="eyebrow">Danh sách tin</span>
              <h2>{articles.length} bài viết</h2>
            </div>
            <button className="btn btn-secondary" type="button" onClick={reloadNews}>
              Tải lại
            </button>
          </div>

          {isLoading ? (
            <div className="support-news-table-loading">
              <span />
              <span />
              <span />
            </div>
          ) : null}

          {!isLoading && !sortedArticles.length ? <div className="news-empty-state">Chưa có tin tức.</div> : null}

          {!isLoading && sortedArticles.length ? (
            <div className="support-news-table">
              {sortedArticles.map((article) => {
                const id = getArticleId(article);
                const thumbnail = getThumbnail(article);

                return (
                  <article className="support-news-row" key={id}>
                    <div className="support-news-thumb">
                      {thumbnail ? <img src={thumbnail} alt={getTitle(article)} /> : <span>NEWS</span>}
                    </div>
                    <div className="support-news-main">
                      <strong>{getTitle(article)}</strong>
                      <span>{getStatus(article)} · Nổi bật: {getFeaturedOrder(article) || "-"}</span>
                      <small>{formatDate(getDate(article))}</small>
                    </div>
                    <div className="support-news-actions">
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => {
                          setEditingId(id);
                          setForm(buildFormFromArticle(article));
                          setMessage("");
                        }}
                      >
                        Sửa
                      </button>
                      <button className="btn btn-ghost" type="button" onClick={() => handleStatus(id, "hidden")}>
                        Ẩn
                      </button>
                      <button className="btn btn-secondary" type="button" onClick={() => handleStatus(id, "published")}>
                        Publish
                      </button>
                      <button className="btn btn-ghost" type="button" onClick={() => handleFeatured(article)}>
                        Nổi bật
                      </button>
                      <button className="btn delete-button" type="button" onClick={() => handleDelete(id)}>
                        Xóa
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>
      </section>
    </>
  );
}

export default SupportNewsManager;
