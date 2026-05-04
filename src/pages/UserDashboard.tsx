import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Button from "../components/common/Button";
import DashboardLayout from "../components/layout/DashboardLayout";
import MapView from "../components/map/MapView";
import { createIncidentWithImages, getUserReports } from "../services/userService";
import type { Incident } from "../types/incident";
import { getIncidentCreatedAt, getIncidentStatus, getIncidentTitle } from "../types/incident";

const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DEFAULT_HCM_LOCATION = { lat: 10.7769, lng: 106.7009 };

function getLocationText(lat: number | "", lng: number | "") {
  return typeof lat === "number" && typeof lng === "number" ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : "";
}

function UserDashboard() {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [tab, setTab] = useState<"home" | "map">("home");
  const [type, setType] = useState("Trộm cắp");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState<number | "">("");
  const [lng, setLng] = useState<number | "">("");
  const [images, setImages] = useState<File[]>([]);
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportHistory, setReportHistory] = useState<Incident[]>([]);

  const imagePreviews = useMemo(
    () => images.map((image) => ({ name: image.name, url: URL.createObjectURL(image) })),
    [images],
  );

  const incidentStats = useMemo(() => {
    const total = reportHistory.length;
    const pending = reportHistory.filter((incident) =>
      getIncidentStatus(incident).toLowerCase().includes("mới"),
    ).length;
    const resolved = reportHistory.filter((incident) =>
      getIncidentStatus(incident).toLowerCase().includes("xong"),
    ).length;
    return { pending, resolved, total };
  }, [reportHistory]);

  useEffect(() => {
    getUserReports()
      .then(setReportHistory)
      .catch(() => undefined);
    updateCurrentLocation();
  }, []);

  useEffect(
    () => () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    },
    [imagePreviews],
  );

  function updateCurrentLocation() {
    setFormMessage("");

    if (!navigator.geolocation) {
      setLat(DEFAULT_HCM_LOCATION.lat);
      setLng(DEFAULT_HCM_LOCATION.lng);
      setFormMessage("Trình duyệt không hỗ trợ định vị. Đã dùng vị trí trung tâm TP.HCM.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
      },
      () => {
        setLat(DEFAULT_HCM_LOCATION.lat);
        setLng(DEFAULT_HCM_LOCATION.lng);
        setFormMessage("Không lấy được GPS. Đã dùng vị trí trung tâm TP.HCM.");
      },
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 10000 },
    );
  }

  function handleImagesSelected(event: ChangeEvent<HTMLInputElement>) {
    const selectedImages = Array.from(event.target.files || []);
    const nextImages = [...images];
    setFormMessage("");

    for (const image of selectedImages) {
      if (nextImages.length >= MAX_IMAGES) {
        setFormMessage("Tối đa 3 ảnh cho mỗi báo cáo.");
        break;
      }

      if (!ACCEPTED_IMAGE_TYPES.includes(image.type)) {
        setFormMessage("Chỉ nhận ảnh jpg, png hoặc webp.");
        continue;
      }

      if (image.size > MAX_IMAGE_SIZE) {
        setFormMessage("Mỗi ảnh phải nhỏ hơn 5MB.");
        continue;
      }

      nextImages.push(image);
    }

    setImages(nextImages);
    event.target.value = "";
  }

  function removeImage(index: number) {
    setImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage("");

    if (!description.trim()) {
      setFormMessage("Nhập mô tả ngắn để lực lượng xử lý nắm tình hình.");
      return;
    }

    if (typeof lat !== "number" || typeof lng !== "number") {
      setFormMessage("Chưa có vị trí. Hãy bấm Cập nhật vị trí trước khi gửi.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("type", type);
    formData.append("description", description.trim());
    formData.append("lat", String(lat));
    formData.append("lng", String(lng));
    images.forEach((image) => formData.append("images", image));

    try {
      const result = await createIncidentWithImages(formData);

      if (result?.Incident) {
        setReportHistory((current) => [result.Incident, ...current]);
      }

      setDescription("");
      setImages([]);
      setFormMessage(result?.Message || "Đã gửi báo cáo thành công.");
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : "Không thể gửi báo cáo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DashboardLayout activeUserTab={tab} onUserTabChange={setTab} role="user">
      {tab === "home" ? (
        <>
          <section className="page-title citizen-title">
            <p className="eyebrow">Người dân</p>
            <h2>Báo cáo nhanh trong vài giây</h2>
            <span>Chọn loại vụ việc, chụp ảnh, gửi kèm vị trí hiện tại.</span>
          </section>

          <section className="citizen-home-grid">
            <MapView
              className="home-mini-map"
              currentLocationLabel="Vị trí hiện tại của bạn"
              defaultToCurrentLocation
              showPoiInNormal={false}
              title="Vị trí của bạn tại TP.HCM"
              variant="compact"
            />

            <form className="panel report-form quick-report-form" onSubmit={handleSubmit}>
              <div className="section-heading">
                <span className="eyebrow">Báo cáo</span>
                <h2>Gửi vụ việc</h2>
              </div>

              <label className="field" htmlFor="incident-type">
                <span>Loại vụ việc</span>
                <select id="incident-type" value={type} onChange={(event) => setType(event.target.value)}>
                  <option>Trộm cắp</option>
                  <option>Gây rối trật tự</option>
                  <option>Tai nạn giao thông</option>
                  <option>Bạo lực</option>
                  <option>Khác</option>
                </select>
              </label>

              <label className="field" htmlFor="description">
                <span>Mô tả</span>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Ví dụ: Có người giật túi tại trước cửa hàng, hướng chạy về..."
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </label>

              <label className="field" htmlFor="location">
                <span>Vị trí (auto)</span>
                <input id="location" readOnly value={getLocationText(lat, lng)} placeholder="Đang lấy vị trí..." />
              </label>

              <div className="photo-actions">
                <button className="btn btn-secondary" type="button" onClick={() => cameraInputRef.current?.click()}>
                  📷 Chụp ảnh
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => uploadInputRef.current?.click()}>
                  📁 Chọn từ máy
                </button>
                <input
                  ref={cameraInputRef}
                  className="visually-hidden"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={handleImagesSelected}
                />
                <input
                  ref={uploadInputRef}
                  className="visually-hidden"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImagesSelected}
                />
              </div>

              {imagePreviews.length ? (
                <div className="image-preview-grid" aria-label="Ảnh đã chọn">
                  {imagePreviews.map((preview, index) => (
                    <figure key={`${preview.name}-${preview.url}`}>
                      <img src={preview.url} alt={`Ảnh báo cáo ${index + 1}`} />
                      <button type="button" onClick={() => removeImage(index)}>
                        Xóa
                      </button>
                    </figure>
                  ))}
                </div>
              ) : null}

              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? "Đang gửi..." : "Gửi báo cáo"}
              </Button>
              {formMessage ? <span className="form-message">{formMessage}</span> : null}
            </form>
          </section>

          <section className="home-bottom-grid">
            <article className="panel emergency-card">
              <span className="eyebrow">Số khẩn cấp</span>
              <div>
                <strong>113</strong>
                <span>Công an</span>
              </div>
              <div>
                <strong>115</strong>
                <span>Cấp cứu</span>
              </div>
              <div>
                <strong>114</strong>
                <span>Cứu hỏa</span>
              </div>
            </article>

            <article className="panel location-card">
              <div>
                <span className="eyebrow">Định vị</span>
                <h2>Cập nhật vị trí</h2>
                <p>{getLocationText(lat, lng) || "Chưa có vị trí hiện tại."}</p>
              </div>
              <Button type="button" variant="secondary" onClick={updateCurrentLocation}>
                Cập nhật vị trí
              </Button>
            </article>
          </section>
        </>
      ) : (
        <>
          <section className="page-title citizen-title">
            <p className="eyebrow">Bản đồ TP.HCM</p>
            <h2>Theo dõi khu vực và vụ án</h2>
            <span>Bản đồ thường hiển thị công an, bệnh viện. Bản đồ vụ án chỉ hiển thị heatmap và điểm vụ việc.</span>
          </section>

          <section className="citizen-map-grid">
            <MapView
              currentLocationLabel="Vị trí hiện tại của bạn"
              defaultToCurrentLocation
              incidents={reportHistory}
              showModeControls
              title="Bản đồ an ninh"
              variant="full"
            />

            <aside className="map-side-panel">
              <section className="panel news-panel">
                <div className="section-heading">
                  <span className="eyebrow">Tin tức</span>
                  <h2>Cập nhật nhanh</h2>
                </div>
                <article>
                  <strong>Tăng cường tuần tra khu trung tâm</strong>
                  <span>Ưu tiên phản ứng nhanh tại khu đông người và tuyến giao thông chính.</span>
                </article>
                <article>
                  <strong>Khuyến nghị gửi ảnh hiện trường</strong>
                  <span>Ảnh rõ giúp lực lượng xử lý xác minh nhanh hơn.</span>
                </article>
              </section>

              <section className="panel crime-stats-panel">
                <div className="section-heading">
                  <span className="eyebrow">Thống kê vụ án</span>
                  <h2>Tình hình báo cáo</h2>
                </div>
                <div className="mini-stat">
                  <span>Tổng vụ việc</span>
                  <strong>{incidentStats.total}</strong>
                </div>
                <div className="mini-stat">
                  <span>Mới tiếp nhận</span>
                  <strong>{incidentStats.pending}</strong>
                </div>
                <div className="mini-stat">
                  <span>Đã xử lý</span>
                  <strong>{incidentStats.resolved}</strong>
                </div>
              </section>

              <section className="panel recent-panel" id="incidents">
                <div className="section-heading">
                  <span className="eyebrow">Gần đây</span>
                  <h2>Báo cáo của bạn</h2>
                </div>
                <div className="incident-list compact-list">
                  {reportHistory.slice(0, 5).map((report) => (
                    <article className="incident-item" key={`${getIncidentTitle(report)}-${getIncidentCreatedAt(report)}`}>
                      <div>
                        <strong>{getIncidentTitle(report)}</strong>
                        <span>{getIncidentCreatedAt(report) || "Vừa cập nhật"}</span>
                      </div>
                      <span className="status-pill">{getIncidentStatus(report)}</span>
                    </article>
                  ))}
                </div>
              </section>
            </aside>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}

export default UserDashboard;
