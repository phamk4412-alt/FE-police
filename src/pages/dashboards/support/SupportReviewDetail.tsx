import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import AdminIcon, { type AdminIconName } from "../../../components/admin/AdminIcons";
import { formatReviewTime, type ReviewCase } from "./supportReviewDemo";

const detailsTabs = [
  { key: "records", label: "Hồ sơ vụ việc", icon: "file" },
  { key: "privacy", label: "Thông tin nhạy cảm", icon: "shield" },
  { key: "preview", label: "Xem trước công khai", icon: "view" },
] as const;

const privacyChecks = [
  "Tên và thông tin người báo cáo",
  "Số điện thoại và thông tin liên hệ",
  "Danh tính nạn nhân hoặc người liên quan",
  "Nội dung nghiệp vụ nội bộ",
  "Hình ảnh có thể làm lộ danh tính",
];

export type DemoDecision = { status: "published" | "rejected"; publicText: string; publicImages: number[]; reason?: string };

function ReviewDialog({ open, drawer = false, titleId, onClose, children }: {
  open: boolean; drawer?: boolean; titleId: string; onClose: () => void; children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => { if (dialog.open) dialog.close(); };
  }, [open]);

  return (
    <dialog ref={ref} className={`review-dialog ${drawer ? "review-drawer" : "review-modal"}`}
      aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="review-dialog-inner">{children}</div>
    </dialog>
  );
}

function SampleMap({ label, light = false }: { label: string; light?: boolean }) {
  return (
    <div className={`review-map ${light ? "is-light" : ""}`} role="img" aria-label={`Sơ đồ minh họa vị trí ${label}`}>
      <span><AdminIcon name="mapPin" /></span>
      {!light && <small>{label}</small>}
    </div>
  );
}

function SamplePhoto({ index, large = false }: { index: number; large?: boolean }) {
  return (
    <div className={`review-photo ${index % 2 ? "is-alt" : ""} ${large ? "is-large" : ""}`} aria-hidden="true">
      <AdminIcon name="image" />
    </div>
  );
}

export default function SupportReviewDetail({ item, open, onClose, onDecision }: {
  item: ReviewCase; open: boolean; onClose: () => void; onDecision: (decision: DemoDecision) => void;
}) {
  const titleId = useId();
  const modalId = useId();
  const [tab, setTab] = useState<(typeof detailsTabs)[number]["key"]>("records");
  const [excluded, setExcluded] = useState(() => privacyChecks.map(() => true));
  const [publicText, setPublicText] = useState(item.publicText);
  const [publicImages, setPublicImages] = useState(item.publicImages);
  const [reason, setReason] = useState("");
  const [modal, setModal] = useState<"approve" | "reject" | "image" | "map" | null>(null);
  const [lastModal, setLastModal] = useState<NonNullable<typeof modal>>("approve");
  const [image, setImage] = useState(0);
  const canApprove = Boolean(publicText.trim()) && excluded.every(Boolean);
  const pending = item.status === "pending";
  const photos = Array.from({ length: item.images }, (_, index) => index);

  function showModal(next: NonNullable<typeof modal>) {
    setLastModal(next);
    setModal(next);
  }

  function finish(status: DemoDecision["status"]) {
    onDecision({ status, publicText: publicText.trim(), publicImages, reason: status === "rejected" ? reason.trim() : undefined });
    setModal(null);
  }

  const fields: { label: string; value: string; icon: AdminIconName }[] = [
    { label: "Loại sự cố", value: item.category, icon: item.icon },
    { label: "Đơn vị xử lý", value: item.unit, icon: "shield" },
    { label: "Thời gian xảy ra", value: formatReviewTime(item.occurred), icon: "clock" },
    { label: "Thời gian tiếp nhận", value: formatReviewTime(item.received), icon: "clock" },
    { label: "Thời gian hoàn thành", value: formatReviewTime(item.completed), icon: "check" },
    { label: "Kết quả xử lý", value: item.outcome, icon: "review" },
  ];

  const modalTitle = { approve: "Xác nhận mô phỏng phê duyệt", reject: "Lý do không duyệt", image: `Ảnh hiện trường 0${image + 1}`, map: "Sơ đồ vị trí minh họa" }[lastModal];

  return (
    <>
      <ReviewDialog open={open} drawer titleId={titleId} onClose={onClose}>
        <header className="review-detail-head">
          <div className="review-detail-top">
            <p className="review-kicker"><AdminIcon name={item.icon} /> {item.category}</p>
            <button type="button" className="review-icon-button" aria-label="Đóng chi tiết" onClick={onClose}><AdminIcon name="close" /></button>
          </div>
          <div className="review-detail-title">
            <h3 id={titleId}>{item.id}</h3><span className="review-pill is-published"><AdminIcon name="check" /> Đã hoàn thành</span>
          </div>
          <p>{item.summary}</p>
        </header>
        <div className="review-tabs review-detail-tabs" role="group" aria-label="Nội dung chi tiết">
          {detailsTabs.map((entry) => (
            <button type="button" key={entry.key} aria-pressed={tab === entry.key} onClick={() => setTab(entry.key)}>
              <AdminIcon name={entry.icon} /> {entry.label}
            </button>
          ))}
        </div>
        <div className="review-detail-scroll">
          <div className="review-detail-content" key={tab}>
          {tab === "records" && (
            <>
              <section>
                <h4>Thông tin vụ việc</h4>
                <dl className="review-detail-grid">
                  {fields.map(({ label, value, icon }) => (
                    <div key={label}><dt><AdminIcon name={icon} /> {label}</dt><dd>{value}</dd></div>
                  ))}
                </dl>
                <p>{item.summary}</p>
                {item.reason && <p><strong>Lý do không duyệt mẫu:</strong> {item.reason}</p>}
              </section>
              <section>
                <div className="review-section-line"><h4><AdminIcon name="image" /> Ảnh và bằng chứng</h4><small>{item.images} ảnh minh họa</small></div>
                {photos.length ? <div className="review-photos">{photos.map((index) => (
                  <button type="button" className="review-media-button" key={index} onClick={() => { setImage(index); showModal("image"); }}>
                    <SamplePhoto index={index} /><span>Xem ảnh mẫu {index + 1}</span>
                  </button>
                ))}</div> : <p>Hồ sơ mẫu chưa có ảnh đính kèm.</p>}
              </section>
              <section>
                <div className="review-section-line"><h4><AdminIcon name="mapPin" /> Vị trí xảy ra sự cố</h4>
                  <button type="button" className="review-text-button" onClick={() => showModal("map")}>Mở sơ đồ lớn <AdminIcon name="chevronRight" /></button>
                </div>
                <SampleMap label={item.address} /><p>{item.address} · {item.coordinates}</p>
              </section>
            </>
          )}
          {tab === "privacy" && (
            <section className="review-privacy">
              <header><AdminIcon name="shield" /><div><h4>Kiểm tra thông tin nhạy cảm</h4><small>Đánh dấu các nhóm thông tin đã loại khỏi bản công khai mẫu.</small></div></header>
              {privacyChecks.map((label, index) => (
                <label key={label}><input type="checkbox" checked={excluded[index]} disabled={!pending}
                  onChange={(event) => setExcluded((current) => current.map((value, position) => position === index ? event.target.checked : value))} />
                  <span>{label}</span><small className={excluded[index] ? "is-checked" : ""}>{excluded[index] ? "Đã loại bỏ" : "Cần kiểm tra"}</small>
                </label>
              ))}
            </section>
          )}
          {tab === "preview" && (
            <section>
              <h4 className="review-public-heading"><AdminIcon name="map" /> Nội dung dự kiến hiển thị với Người dân</h4>
              <div className="review-public-card">
                <SampleMap label={item.area} light />
                <div><span className="review-pill is-published"><AdminIcon name="check" /> Đã hoàn thành</span>
                  <h4>{item.category}</h4><p>{publicText.trim() || "Chưa có mô tả công khai."}</p>
                  <small><AdminIcon name="mapPin" /> {item.area} · Hoàn thành {formatReviewTime(item.completed)}</small>
                </div>
              </div>
              <label className="review-field">Mô tả công khai đã kiểm duyệt
                <textarea value={publicText} readOnly={!pending} maxLength={1000} rows={4} onChange={(event) => setPublicText(event.target.value)} />
              </label>
              {photos.length > 0 && <>
                <h4>Hình ảnh được chọn để công khai</h4>
                <div className="review-photos">{photos.map((index) => (
                  <label className="review-photo-option" key={index}>
                    <input type="checkbox" disabled={!pending} checked={publicImages.includes(index)}
                      onChange={(event) => setPublicImages((current) => event.target.checked ? [...current, index].sort() : current.filter((value) => value !== index))} />
                    <div><SamplePhoto index={index} /><span>Ảnh hiện trường 0{index + 1}</span></div>
                  </label>
                ))}</div>
              </>}
            </section>
          )}
          </div>
        </div>
        <footer className="review-dialog-footer">
          <small>Hồ sơ và thao tác minh họa</small>
          {pending && <>
            <button type="button" className="review-button is-reject" onClick={() => showModal("reject")}><AdminIcon name="close" /> Không duyệt</button>
            <button type="button" className="review-button is-approve" onClick={() => showModal("approve")}><AdminIcon name="check" /> Phê duyệt công khai</button>
          </>}
        </footer>
      </ReviewDialog>

      <ReviewDialog open={modal !== null} titleId={modalId} onClose={() => setModal(null)}>
        <header className="review-modal-head"><h3 id={modalId}>{modalTitle}</h3>
          <button type="button" className="review-icon-button" aria-label="Đóng hộp thoại" onClick={() => setModal(null)}><AdminIcon name="close" /></button>
        </header>
        <div className="review-modal-body">
          {lastModal === "approve" && <>
            <p>Thao tác này chỉ cập nhật dữ liệu minh họa trong phiên.</p>
            <div className="review-confirm-summary"><strong>{item.category} · {item.area}</strong>
              <p>{publicText.trim() || "Chưa có mô tả công khai."}</p>
              <small>Hoàn thành {formatReviewTime(item.completed)} · {publicImages.length} ảnh mẫu</small>
            </div>
            {!canApprove && <p role="status">Hãy bổ sung mô tả và hoàn tất kiểm tra thông tin nhạy cảm.</p>}
          </>}
          {lastModal === "reject" && <>
            <p>Lý do chỉ lưu trong dữ liệu minh họa của phiên này.</p>
            <label className="review-field">Lý do không duyệt
              <textarea rows={4} value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} required />
            </label>
          </>}
          {lastModal === "image" && <SamplePhoto index={image} large />}
          {lastModal === "map" && <><SampleMap label={item.address} /><p>{item.coordinates}</p></>}
        </div>
        {(lastModal === "approve" || lastModal === "reject") && (
          <footer className="review-dialog-footer">
            <button type="button" className="review-button" onClick={() => setModal(null)}>Quay lại</button>
            {lastModal === "approve"
              ? <button type="button" className="review-button is-approve" disabled={!canApprove} onClick={() => finish("published")}><AdminIcon name="check" /> Xác nhận mô phỏng</button>
              : <button type="button" className="review-button is-reject" disabled={!reason.trim()} onClick={() => finish("rejected")}><AdminIcon name="close" /> Xác nhận mô phỏng</button>}
          </footer>
        )}
      </ReviewDialog>
    </>
  );
}
