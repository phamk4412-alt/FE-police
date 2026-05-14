import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createSupportNews,
  deleteSupportNews,
  getSupportNews,
  resolveMediaUrl,
  updateSupportNews,
  updateSupportNewsStatus,
} from "../../services/newsService";
import type { NewsArticle, NewsPayload } from "../../types/news";

const statusLabels: Record<NewsPayload["status"], string> = {
  draft: "Bản nháp",
  hidden: "Đã ẩn",
  published: "Đã đăng",
};

const emptyForm: NewsPayload = {
  category: "An ninh",
  content: "",
  featuredOrder: null,
  isFeatured: false,
  status: "draft",
  summary: "",
  thumbnailUrl: "",
  title: "",
};

type ToastTone = "error" | "success";

interface ToastState {
  text: string;
  tone: ToastTone;
}

function getArticleId(article: NewsArticle) {
  return String(article.id ?? article.Id ?? "");
}

function getTitle(article: NewsArticle) {
  return article.title || article.Title || "Tin tức";
}

function getStatus(article: NewsArticle): NewsPayload["status"] {
  const status = article.status || article.Status || "draft";
  return status === "published" || status === "hidden" ? status : "draft";
}

function getFeaturedOrder(article: NewsArticle) {
  return article.featuredOrder ?? article.FeaturedOrder ?? null;
}

function getCategory(article: NewsArticle) {
  return article.category || article.Category || "An ninh";
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

function getNewsType(article: NewsArticle) {
  const order = getFeaturedOrder(article);
  if (order === 1) {
    return { className: "is-priority", label: "ĐÁNG CHÚ Ý" };
  }

  if (order === 2 || order === 3 || order === 4) {
    return { className: "is-featured", label: "NỔI BẬT" };
  }

  return { className: "is-regular", label: "TIN THƯỜNG" };
}

function toTechnicalMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || "");
}

function getFriendlyError(error: unknown) {
  const message = toTechnicalMessage(error);
  const lower = message.toLowerCase();

  if (message.includes("401")) {
    return "API tin tức chưa xác thực được quyền hỗ trợ. Bạn vẫn đang đăng nhập, vui lòng thử lại sau.";
  }

  if (message.includes("403")) {
    return "Không có quyền thực hiện thao tác này.";
  }

  if (message.includes("500")) {
    return "Máy chủ đang gặp sự cố. Vui lòng thử lại sau.";
  }

  if (lower.includes("network") || lower.includes("failed to fetch")) {
    return "Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.";
  }

  return "Không thể hoàn tất thao tác. Vui lòng thử lại.";
}

function buildFormFromArticle(article: NewsArticle): NewsPayload {
  return {
    category: getCategory(article),
    content: article.content || article.Content || "",
    featuredOrder: getFeaturedOrder(article),
    isFeatured: Boolean(article.isFeatured || article.IsFeatured),
    status: getStatus(article),
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
  const [toast, setToast] = useState<ToastState | null>(null);

  const sortedArticles = useMemo(
    () => [...articles].sort((first, second) => new Date(getDate(second)).getTime() - new Date(getDate(first)).getTime()),
    [articles],
  );

  const stats = useMemo(() => {
    const priority = articles.filter((article) => getFeaturedOrder(article) === 1).length;
    const featured = articles.filter((article) => {
      const order = getFeaturedOrder(article);
      return order === 2 || order === 3 || order === 4;
    }).length;

    return {
      featured: Math.min(featured, 3),
      priority: Math.min(priority, 1),
      regular: articles.filter((article) => {
        const order = getFeaturedOrder(article);
        return order !== 1 && order !== 2 && order !== 3 && order !== 4;
      }).length,
    };
  }, [articles]);

  useEffect(() => {
    reloadNews();
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 5200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function showToast(text: string, tone: ToastTone = "error") {
    setToast({ text, tone });
  }

  function handleApiError(error: unknown) {
    console.error("Support news API error", error);
    showToast(getFriendlyError(error), "error");
  }

  function reloadNews() {
    setIsLoading(true);
    getSupportNews()
      .then(setArticles)
      .catch(handleApiError)
      .finally(() => setIsLoading(false));
  }

  function resetForm() {
    setEditingId("");
    setForm(emptyForm);
  }

  function updateField<Key extends keyof NewsPayload>(key: Key, value: NewsPayload[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim()) {
      showToast("Vui lòng nhập tiêu đề.");
      return;
    }

    if (!form.content.trim()) {
      showToast("Vui lòng nhập nội dung.");
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
        showToast("Đã cập nhật tin tức.", "success");
      } else {
        await createSupportNews(payload);
        showToast("Đã tạo tin tức.", "success");
      }
      resetForm();
      reloadNews();
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatus(id: string, status: NewsPayload["status"]) {
    try {
      await updateSupportNewsStatus(id, status);
      showToast(status === "published" ? "Đã đăng bài viết." : "Đã ẩn bài viết.", "success");
      reloadNews();
    } catch (error) {
      handleApiError(error);
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
      showToast("Đã xóa tin tức.", "success");
      reloadNews();
    } catch (error) {
      handleApiError(error);
    }
  }

  return (
    <>
      {toast ? (
        <div className={`support-news-toast ${toast.tone === "success" ? "is-success" : "is-error"}`} role="alert">
          <strong>!</strong>
          <span>{toast.text}</span>
          <button type="button" aria-label="Đóng thông báo" onClick={() => setToast(null)}>
            Đóng
          </button>
        </div>
      ) : null}

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
              <button className="btn btn-ghost" type="button" onClick={resetForm}>
                Hủy
              </button>
            ) : null}
          </div>

          <label className="field" htmlFor="news-title">
            <span>Tiêu đề</span>
            <input id="news-title" value={form.title} onChange={(event) => updateField("title", event.target.value)} />
          </label>

          <label className="field support-news-summary-field" htmlFor="news-summary">
            <span>Mô tả ngắn</span>
            <textarea
              id="news-summary"
              value={form.summary}
              onChange={(event) => updateField("summary", event.target.value)}
            />
          </label>

          <label className="field support-news-content-field" htmlFor="news-content">
            <span>Nội dung</span>
            <textarea
              id="news-content"
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

          <div className="support-news-field-row">
            <label className="field" htmlFor="news-status">
              <span>Trạng thái</span>
              <select
                id="news-status"
                value={form.status}
                onChange={(event) => updateField("status", event.target.value as NewsPayload["status"])}
              >
                <option value="draft">{statusLabels.draft}</option>
                <option value="published">{statusLabels.published}</option>
                <option value="hidden">{statusLabels.hidden}</option>
              </select>
            </label>

            <label className="field" htmlFor="featured-order">
              <span>Thứ tự nổi bật</span>
              <select
                id="featured-order"
                disabled={!form.isFeatured}
                value={form.featuredOrder || 1}
                onChange={(event) => updateField("featuredOrder", Number(event.target.value))}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </label>
          </div>

          <label className="support-news-checkbox">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(event) => updateField("isFeatured", event.target.checked)}
            />
            <span>Tin nổi bật</span>
          </label>

          <button className="btn btn-primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Tạo tin"}
          </button>
        </form>

        <section className="support-news-right-column">
          <div className="support-news-stats" aria-label="Thống kê tin tức">
            <article className="support-news-stat is-priority">
              <span>Tin đáng chú ý</span>
              <strong>{stats.priority}</strong>
              <small>Tối đa 1 bài</small>
            </article>
            <article className="support-news-stat is-featured">
              <span>Tin nổi bật</span>
              <strong>{stats.featured}</strong>
              <small>Tối đa 3 bài</small>
            </article>
            <article className="support-news-stat is-regular">
              <span>Tin thường</span>
              <strong>{stats.regular}</strong>
              <small>Không giới hạn</small>
            </article>
          </div>

          <section className="panel support-news-list-panel">
            <div className="section-heading support-panel-heading">
              <div>
                <span className="eyebrow">Danh sách tin</span>
                <h2>Bài viết đã tạo</h2>
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

            {!isLoading && !sortedArticles.length ? (
              <div className="support-news-empty-card">
                <span className="support-news-empty-icon" aria-hidden="true" />
                <strong>Chưa có bài viết nào được tạo.</strong>
                <p>Dùng form bên trái để tạo tin cảnh báo, thông báo hoặc tin nổi bật cho người dân.</p>
              </div>
            ) : null}

            {!isLoading && sortedArticles.length ? (
              <div className="support-news-table">
                {sortedArticles.map((article) => {
                  const id = getArticleId(article);
                  const thumbnail = getThumbnail(article);
                  const type = getNewsType(article);

                  return (
                    <article className="support-news-row" key={id}>
                      <div className="support-news-thumb">
                        {thumbnail ? <img src={thumbnail} alt={getTitle(article)} /> : <span>NEWS</span>}
                      </div>
                      <div className="support-news-main">
                        <div className="support-news-row-header">
                          <span className={`support-news-type-badge ${type.className}`}>{type.label}</span>
                          <span className={`support-news-status-badge is-${getStatus(article)}`}>{statusLabels[getStatus(article)]}</span>
                        </div>
                        <strong>{getTitle(article)}</strong>
                        <span>{getCategory(article)}</span>
                        <small>{formatDate(getDate(article))}</small>
                      </div>
                      <div className="support-news-actions">
                        <button
                          className="btn btn-secondary"
                          type="button"
                          onClick={() => {
                            setEditingId(id);
                            setForm(buildFormFromArticle(article));
                          }}
                        >
                          Sửa
                        </button>
                        <button className="btn btn-secondary" type="button" onClick={() => handleStatus(id, "published")}>
                          Publish
                        </button>
                        <button className="btn btn-ghost" type="button" onClick={() => handleStatus(id, "hidden")}>
                          Ẩn
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
      </section>
    </>
  );
}

export default SupportNewsManager;
