import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPoliceReport } from "../../../services/policeService";
import type { Incident } from "../../../types/incident";
import PoliceDialog from "./PoliceDialog";
import { formatPoliceTime } from "./policeUtils";

export default function PoliceReportDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (incident: Incident) => void }) {
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [recordedAt] = useState(() => new Date().toISOString());
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  function locate() {
    if (!navigator.geolocation) { setError("Thiết bị không hỗ trợ định vị. Bạn có thể nhập tọa độ GPS."); return; }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition((position) => {
      if (!mountedRef.current) return;
      setLatitude(position.coords.latitude.toFixed(6));
      setLongitude(position.coords.longitude.toFixed(6));
      setLocating(false);
    }, () => { if (mountedRef.current) { setLocating(false); setError("Không lấy được vị trí. Hãy kiểm tra quyền định vị hoặc nhập tọa độ GPS."); } }, { timeout: 10000, enableHighAccuracy: true });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!latitude.trim() || !longitude.trim() || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < 10.3 || lat > 11.1 || lng < 106.4 || lng > 107.1) { setError("Vui lòng nhập tọa độ trong khu vực TP.HCM (vĩ độ 10.3–11.1, kinh độ 106.4–107.1)."); return; }
    const data = new FormData(event.currentTarget);
    const address = String(data.get("Address") || "").trim();
    const detail = String(data.get("Detail") || "").trim();
    data.delete("Address");
    data.set("Detail", [detail, address ? `Địa chỉ hiện trường: ${address}` : ""].filter(Boolean).join("\n\n"));
    data.set("Latitude", String(lat));
    data.set("Longitude", String(lng));
    for (const image of images) data.append("Images", image);
    setBusy(true);
    try { onCreated(await createPoliceReport(data)); }
    catch (error) { setError(error instanceof Error ? error.message : "Không tạo được báo cáo. Vui lòng thử lại."); }
    finally { setBusy(false); }
  }

  function close() { mountedRef.current = false; onClose(); }
  return <PoliceDialog title="Tạo báo cáo hiện trường" eyebrow="Báo cáo nhanh" busy={busy} onClose={close}>
    <form onSubmit={submit} className="police-report-form"><div className="police-dialog-body">
      <div className="police-form-grid"><label>Loại vụ việc<select name="Category" disabled={busy}><option>Tai nạn giao thông</option><option>An ninh trật tự</option><option>Trộm cắp tài sản</option><option>Hỗ trợ người dân</option><option>Khác</option></select></label><label>Thời gian ghi nhận<input readOnly value={formatPoliceTime(recordedAt)} /></label></div>
      <label>Tiêu đề<input name="Title" required maxLength={160} placeholder="Nhập mô tả ngắn vụ việc" disabled={busy} /></label>
      <label>Mô tả hiện trường<textarea name="Detail" required maxLength={3500} rows={4} placeholder="Mô tả diễn biến và tình trạng hiện tại..." disabled={busy} /></label>
      <label>Địa chỉ hiện trường<input name="Address" maxLength={300} placeholder="Số nhà, đường, phường, khu vực" disabled={busy} /></label>
      <div className="police-location-heading"><span>Vị trí GPS</span><button type="button" className="police-button" disabled={busy || locating} onClick={locate}>{locating ? "Đang lấy vị trí..." : "Lấy vị trí hiện tại"}</button></div>
      <div className="police-form-grid"><label>Vĩ độ<input aria-label="Vĩ độ" type="number" step="any" required min="10.3" max="11.1" value={latitude} onChange={(event) => setLatitude(event.target.value)} disabled={busy} placeholder="10.7769" /></label><label>Kinh độ<input aria-label="Kinh độ" type="number" step="any" required min="106.4" max="107.1" value={longitude} onChange={(event) => setLongitude(event.target.value)} disabled={busy} placeholder="106.7009" /></label></div>
      <label className="police-upload">Thêm hình ảnh hiện trường <small>Tối đa 3 ảnh JPG, PNG hoặc WebP, mỗi ảnh tối đa 5 MB.</small><input aria-label="Hình ảnh hiện trường" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={(event) => {
        const files = Array.from(event.target.files || []);
        if (files.length > 3 || files.some((file) => file.size === 0 || file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type))) { setError("Chọn tối đa 3 ảnh JPG, PNG hoặc WebP hợp lệ, mỗi ảnh không quá 5 MB."); event.target.value = ""; setImages([]); return; }
        setError(""); setImages(files);
      }} />{images.length ? <span>{images.map((image) => image.name).join(", ")}</span> : null}</label>
      {error ? <p className="police-form-error" role="alert">{error}</p> : null}
    </div><footer className="police-dialog-footer"><button className="police-button" disabled={busy} type="button" onClick={close}>Hủy</button><button className="police-button police-button-primary" disabled={busy || locating} type="submit">{busy ? "Đang gửi báo cáo..." : "Tạo báo cáo"}</button></footer></form>
  </PoliceDialog>;
}
