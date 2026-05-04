import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Button from "../components/common/Button";
import DashboardLayout from "../components/layout/DashboardLayout";
import MapView from "../components/map/MapView";
import { createIncidentWithImages, getUserReports } from "../services/userService";
import type { Incident } from "../types/incident";

const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DEFAULT_HCM_LOCATION = { lat: 10.7769, lng: 106.7009 };

function getLocationText(lat: number | "", lng: number | "") {
  return typeof lat === "number" && typeof lng === "number"
    ? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    : "";
}

function isSecureHost() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.location.protocol === "https:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

function buildIncidentTitle(category: string, description: string) {
  const summary = description.trim().slice(0, 48);
  return summary ? `${category} - ${summary}` : category;
}

function UserDashboard() {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [tab, setTab] = useState<"home" | "map">("home");
  const [category, setCategory] = useState("Trộm cắp");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState<number | "">("");
  const [lng, setLng] = useState<number | "">("");
  const [images, setImages] = useState<File[]>([]);
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [canUseLiveCamera, setCanUseLiveCamera] = useState(false);
  const [reportHistory, setReportHistory] = useState<Incident[]>([]);

  const imagePreviews = useMemo(
    () => images.map((image) => ({ name: image.name, url: URL.createObjectURL(image) })),
    [images],
  );

  useEffect(() => {
    setCanUseLiveCamera(
      typeof navigator !== "undefined" &&
        isSecureHost() &&
        typeof navigator.mediaDevices?.getUserMedia === "function",
    );

    getUserReports()
      .then(setReportHistory)
      .catch(() => undefined);

    updateCurrentLocation();
  }, []);

  useEffect(
    () => () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
      stopCameraStream();
    },
    [imagePreviews],
  );

  useEffect(() => {
    if (!isCameraOpen || !videoRef.current || !streamRef.current) {
      return;
    }

    videoRef.current.srcObject = streamRef.current;
    void videoRef.current.play().catch(() => undefined);
  }, [isCameraOpen]);

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

  function validateAndAppendImages(nextImages: File[], selectedImages: File[]) {
    let nextMessage = "";

    for (const image of selectedImages) {
      if (nextImages.length >= MAX_IMAGES) {
        nextMessage = "Tối đa 3 ảnh cho mỗi báo cáo.";
        break;
      }

      if (!ACCEPTED_IMAGE_TYPES.includes(image.type)) {
        nextMessage = "Chỉ nhận ảnh jpg, png hoặc webp.";
        continue;
      }

      if (image.size > MAX_IMAGE_SIZE) {
        nextMessage = "Mỗi ảnh phải nhỏ hơn 5MB.";
        continue;
      }

      nextImages.push(image);
    }

    setFormMessage(nextMessage);
    setImages(nextImages);
  }

  function handleImagesSelected(event: ChangeEvent<HTMLInputElement>) {
    const selectedImages = Array.from(event.target.files || []);
    validateAndAppendImages([...images], selectedImages);
    event.target.value = "";
  }

  function removeImage(index: number) {
    setImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  function stopCameraStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function openLiveCamera() {
    if (!canUseLiveCamera) {
      cameraInputRef.current?.click();
      return;
    }

    try {
      stopCameraStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
        },
      });

      streamRef.current = stream;
      setIsCameraOpen(true);
      setFormMessage("");
    } catch {
      cameraInputRef.current?.click();
      setFormMessage("Không mở được camera trực tiếp. Đã chuyển sang trình chọn ảnh/camera của thiết bị.");
    }
  }

  function closeLiveCamera() {
    stopCameraStream();
    setIsCameraOpen(false);
  }

  function captureFromLiveCamera() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      setFormMessage("Camera chưa sẵn sàng để chụp.");
      return;
    }

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      setFormMessage("Không thể đọc dữ liệu từ camera.");
      return;
    }

    context.drawImage(video, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setFormMessage("Không thể tạo ảnh từ camera.");
          return;
        }

        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
        validateAndAppendImages([...images], [file]);
        closeLiveCamera();
      },
      "image/jpeg",
      0.92,
    );
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
    formData.append("title", buildIncidentTitle(category, description));
    formData.append("detail", description.trim());
    formData.append("category", category);
    formData.append("latitude", String(lat));
    formData.append("longitude", String(lng));
    images.forEach((image) => {
      formData.append("images", image);
    });

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
            <span>Map lớn để nhìn khu vực, camera thật khi môi trường cho phép, gửi bằng multipart/form-data.</span>
          </section>

          <section className="citizen-home-grid">
            <MapView
              className="home-main-map"
              currentLocationLabel="Vị trí hiện tại của bạn"
              defaultToCurrentLocation
              showPoiInNormal={false}
              title="Vị trí hiện tại tại TP.HCM"
              variant="compact"
            />

            <form className="panel report-form quick-report-form" onSubmit={handleSubmit}>
              <div className="section-heading">
                <span className="eyebrow">Báo cáo</span>
                <h2>Gửi vụ việc</h2>
              </div>

              <label className="field" htmlFor="incident-type">
                <span>Loại vụ việc</span>
                <select
                  id="incident-type"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
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
                  placeholder="Ví dụ: Có người giật túi trước cửa hàng, hướng chạy về..."
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </label>

              <label className="field" htmlFor="location">
                <span>Vị trí (auto)</span>
                <input
                  id="location"
                  readOnly
                  value={getLocationText(lat, lng)}
                  placeholder="Đang lấy vị trí..."
                />
              </label>

              <div className="photo-actions">
                <button className="btn btn-secondary" type="button" onClick={() => void openLiveCamera()}>
                  📷 Chụp ảnh
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => uploadInputRef.current?.click()}>
                  📁 Chọn ảnh
                </button>
                <input
                  ref={cameraInputRef}
                  className="visually-hidden"
                  type="file"
                  accept="image/*"
                  capture="environment"
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

              <div className="camera-hint">
                <span>{`Ảnh đã chọn: ${images.length}/${MAX_IMAGES}`}</span>
                <small>
                  `getUserMedia` dùng khi chạy trên HTTPS hoặc localhost. Nếu không được, nút chụp sẽ fallback sang input `capture="environment"`.
                </small>
              </div>

              {isCameraOpen ? (
                <div className="camera-capture-panel">
                  <video ref={videoRef} autoPlay muted playsInline />
                  <canvas ref={canvasRef} className="visually-hidden" />
                  <div className="camera-capture-actions">
                    <button className="btn btn-secondary" type="button" onClick={captureFromLiveCamera}>
                      Chụp khung hình
                    </button>
                    <button className="btn btn-ghost" type="button" onClick={closeLiveCamera}>
                      Đóng camera
                    </button>
                  </div>
                </div>
              ) : null}

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
            <h2>Theo dõi khu vực và vụ việc</h2>
            <span>Map full-width, không còn panel thừa, toàn bộ filter và nút nằm dưới map.</span>
          </section>

          <section className="citizen-map-wrapper">
            <MapView
              className="city-map-view"
              currentLocationLabel="Vị trí hiện tại của bạn"
              defaultToCurrentLocation
              incidents={reportHistory}
              showModeControls
              title="Bản đồ an ninh 3D"
              variant="full"
            />
          </section>
        </>
      )}
    </DashboardLayout>
  );
}

export default UserDashboard;
