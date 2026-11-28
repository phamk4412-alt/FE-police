import { useEffect, useId, useRef, useState } from "react";
import AdminIcon from "../../components/admin/AdminIcons";
import Button from "../../components/common/Button";
import { canStoreMapboxAddress, reverseIncidentAddress } from "../../services/userService";
import { APP_MARK_URL, APP_NAME } from "../../utils/constants";

interface ReportPhotoDialogProps {
  src: string;
  number: number;
  reporter: string;
  time: string;
  coordinates: string;
  latitude?: number;
  longitude?: number;
  takenInApp: boolean;
  sharesReportGps: boolean;
  reportLookup?: string | null;
  onClose: () => void;
}

function wrapStampText(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? line + " " + word : word;
    if (line && ctx.measureText(next).width > width) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function saveStampedPhoto(photo: HTMLImageElement, number: number, details: string[]) {
  await photo.decode();
  const logo = new Image();
  logo.src = APP_MARK_URL;
  await logo.decode();

  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 2560 / Math.max(photo.naturalWidth, photo.naturalHeight));
  canvas.width = Math.max(1, Math.round(photo.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(photo.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Trình duyệt không hỗ trợ tạo ảnh.");

  const width = canvas.width;
  const height = canvas.height;
  ctx.fillStyle = "#101722";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(photo, 0, 0, width, height);

  const unit = Math.min(width, height);
  const margin = unit * .025;
  const cardWidth = Math.min(width - 2 * margin, Math.max(width * .64, unit * .8));
  let fontSize = unit * .028;
  ctx.font = `${fontSize}px Arial, sans-serif`;
  const textWidth = cardWidth - margin * 2;
  let lines = details.flatMap((text) => wrapStampText(ctx, text, textWidth));
  let lineHeight = fontSize * 1.35;
  const maxCardHeight = height * .55;
  let cardHeight = margin * 2 + lineHeight * (lines.length + 2);
  if (cardHeight > maxCardHeight) {
    const shrink = maxCardHeight / cardHeight;
    fontSize *= shrink;
    lineHeight *= shrink;
    ctx.font = `${fontSize}px Arial, sans-serif`;
    lines = details.flatMap((text) => wrapStampText(ctx, text, textWidth));
    cardHeight = margin * 2 + lineHeight * (lines.length + 2);
  }

  const x = width - cardWidth - margin;
  const y = height - cardHeight - margin;
  ctx.fillStyle = "rgba(9, 16, 24, .88)";
  ctx.fillRect(x, y, cardWidth, cardHeight);
  ctx.drawImage(logo, x + margin, y + margin, lineHeight * 1.35, lineHeight * 1.35);
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "top";
  ctx.fillText(APP_NAME, x + margin + lineHeight * 1.65, y + margin + lineHeight * .18, textWidth - lineHeight * 1.65);
  lines.forEach((line, index) => ctx.fillText(line, x + margin, y + margin + (index + 2) * lineHeight, textWidth));

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", .92));
  if (!blob) throw new Error("Không thể tạo bản ảnh kèm thông tin.");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `anh-bao-cao-${number}-kem-thong-tin.jpg`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export default function ReportPhotoDialog({
  src, number, reporter, time, coordinates, latitude, longitude, takenInApp, sharesReportGps, reportLookup, onClose,
}: ReportPhotoDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);
  const titleId = useId();
  const [lookup, setLookup] = useState<{ key: string; address: string | null } | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const key = `${latitude},${longitude}`;
  const address = sharesReportGps ? reportLookup : lookup?.key === key ? lookup.address : undefined;
  const positionLabel = takenInApp ? "GPS khi chụp" : "GPS khi chọn ảnh";
  const addressLabel = !coordinates ? "Chưa xác định"
    : address === undefined ? "Đang tra vị trí…"
    : address || "Không tìm thấy tên vị trí";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    if (sharesReportGps || typeof latitude !== "number" || typeof longitude !== "number") return;
    const controller = new AbortController();
    let active = true;
    const timeout = window.setTimeout(() => controller.abort(), 8000);

    void reverseIncidentAddress(latitude, longitude, controller.signal)
      .then((value) => { if (active) setLookup({ key, address: value }); })
      .catch(() => { if (active) setLookup({ key, address: null }); })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [key, latitude, longitude, sharesReportGps]);

  async function handleDownload() {
    if (!photoRef.current || saving) return;
    setSaving(true);
    setError("");
    try {
      await saveStampedPhoto(photoRef.current, number, [
        `Người báo cáo: ${reporter}`,
        `Thời gian: ${time}`,
        `${positionLabel}: ${coordinates || "Chưa ghi nhận"}`,
        `Vị trí: ${address && canStoreMapboxAddress ? address : "Chưa có tên vị trí trong bản lưu"}`,
      ]);
    } catch {
      setError("Không thể tải ảnh kèm thông tin. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog className="report-photo-dialog" ref={dialogRef} aria-labelledby={titleId} onClose={onClose}>
      <header className="report-photo-header">
        <h2 id={titleId}><AdminIcon name="image" /> Ảnh báo cáo {number}</h2>
        <Button variant="ghost" type="button" onClick={() => dialogRef.current?.close()}>
          <AdminIcon name="close" /> Đóng
        </Button>
      </header>
      <div className="report-photo-stage">
        <figure className="report-photo-frame">
          <img ref={photoRef} src={src} alt={`Ảnh hiện trường ${number}`} className="report-photo-full" />
          <figcaption className="report-photo-stamp">
            <ReportPhotoStamp reporter={reporter} time={time} positionLabel={positionLabel}
              coordinates={coordinates || "Chưa ghi nhận"} address={addressLabel} />
          </figcaption>
        </figure>
      </div>
      <footer className="report-photo-footer">
        <p>{address && !canStoreMapboxAddress ? "Tên vị trí từ Mapbox hiển thị trong bản xem trước." : "Bản tải về có thông tin ở góc ảnh."}</p>
        <Button variant="secondary" type="button" disabled={saving || (!!coordinates && address === undefined)} onClick={() => void handleDownload()}>
          {saving ? "Đang tạo ảnh…" : "Tải bản kèm thông tin"}
        </Button>
        {error ? <p role="alert">{error}</p> : null}
      </footer>
    </dialog>
  );
}

export function ReportPhotoStamp({ reporter, time, positionLabel, coordinates, address }: {
  reporter: string; time: string; positionLabel: string; coordinates: string; address: string;
}) {
  return (
    <>
      <div className="report-photo-brand"><img src={APP_MARK_URL} alt="" /> <strong>{APP_NAME}</strong></div>
      <dl>
        <div><dt>Người báo cáo</dt><dd>{reporter}</dd></div>
        <div><dt>Thời gian</dt><dd>{time}</dd></div>
        <div><dt>{positionLabel}</dt><dd>{coordinates}</dd></div>
        <div><dt>Tên vị trí</dt><dd aria-live="polite">{address}</dd></div>
      </dl>
    </>
  );
}
