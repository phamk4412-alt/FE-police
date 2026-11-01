import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import AdminIcon, { type AdminIconName } from "../../components/admin/AdminIcons";
import DashboardLayout from "../../components/layout/DashboardLayout";
import MapView from "../../components/map/MapView";
import UserNewsPage from "../news/UserNewsPage";
import { createIncidentWithImages } from "../../services/userService";
import "../../assets/styles/citizen.css";

const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const emergencyNumbers: Array<{
  icon: AdminIconName;
  label: string;
  note: string;
  number: string;
  tone: "police" | "medical" | "fire";
}> = [
  { icon: "police", label: "Công an", note: "An ninh trật tự", number: "113", tone: "police" },
  { icon: "ambulance", label: "Cấp cứu", note: "Y tế khẩn cấp", number: "115", tone: "medical" },
  { icon: "flame", label: "Cứu hỏa", note: "Cháy nổ, cứu nạn", number: "114", tone: "fire" },
];

function getLocationText(lat: number | "", lng: number | "") {
  return typeof lat === "number" && typeof lng === "number" &&
    Number.isFinite(lat) && Number.isFinite(lng) &&
    Math.abs(lat) <= 90 && Math.abs(lng) <= 180
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

function canUseLiveCameraDevice() {
  return (
    typeof navigator !== "undefined" &&
    isSecureHost() &&
    typeof navigator.mediaDevices?.getUserMedia === "function"
  );
}

function buildIncidentTitle(category: string, description: string) {
  const summary = description.trim().slice(0, 48);
  return summary ? `${category} - ${summary}` : category;
}

type UserDashboardTab = "home" | "map" | "news";

function UserDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const locationRequestIdRef = useRef(0);
  const [category, setCategory] = useState("Trộm cắp");
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState<number | "">("");
  const [lng, setLng] = useState<number | "">("");
  const [locationStatus, setLocationStatus] = useState<"loading" | "success" | "error">("loading");
  const [locationError, setLocationError] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [formMessage, setFormMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [canUseLiveCamera] = useState(canUseLiveCameraDevice);

  const imagePreviews = useMemo(
    () => images.map((image) => ({ name: image.name, url: URL.createObjectURL(image) })),
    [images],
  );
  const isOtherCategory = category === "Khác";
  const normalizedCustomCategory = customCategory.trim();
  const titleCategory = isOtherCategory && normalizedCustomCategory ? normalizedCustomCategory : category;
  const coordinatesText = getLocationText(lat, lng);
  const hasValidLocation = locationStatus === "success" && coordinatesText !== "";
  const locationText = locationStatus === "loading"
    ? "Đang lấy vị trí..."
    : hasValidLocation
      ? `Đã có vị trí: ${coordinatesText}`
      : "Chưa có vị trí hiện tại";
  const newsMatch = location.pathname.match(/^\/user\/news\/?([^/]*)?/);
  const isNewsRoute = location.pathname.startsWith("/user/news");
  const pathname = location.pathname.replace(/\/+$/, "");
  const tab: UserDashboardTab = isNewsRoute ? "news" : pathname === "/user/map" ? "map" : "home";
  const activeUserTab = tab;
  const newsArticleId = newsMatch?.[1] ? decodeURIComponent(newsMatch[1]) : undefined;
  const decorVariant = isNewsRoute
    ? newsArticleId
      ? "user-news-detail"
      : "user-news"
    : tab === "map"
      ? "user-map"
      : "user-home";

  function handleUserTabChange(nextTab: UserDashboardTab) {
    const tabPaths: Record<UserDashboardTab, string> = {
      home: "/user",
      map: "/user/map",
      news: "/user/news",
    };
    const nextPath = tabPaths[nextTab];

    if (pathname !== nextPath) {
      navigate(nextPath);
    }
  }

  useEffect(() => {
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
    const requestId = ++locationRequestIdRef.current;
    setLocationStatus("loading");
    setLocationError("");
    setLat("");
    setLng("");

    function handleLocationError(message: string) {
      if (requestId !== locationRequestIdRef.current) {
        return;
      }

      setLat("");
      setLng("");
      setLocationStatus("error");
      setLocationError(`${message} Hãy bật định vị trên thiết bị, cho phép website truy cập Vị trí trong cài đặt trình duyệt, rồi bấm Cập nhật vị trí để thử lại.`);
    }

    if (!navigator.geolocation) {
      handleLocationError("Trình duyệt không hỗ trợ định vị. Hãy sử dụng trình duyệt có hỗ trợ định vị.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (requestId !== locationRequestIdRef.current) {
          return;
        }

        if (!getLocationText(position.coords.latitude, position.coords.longitude)) {
          handleLocationError("Tọa độ GPS không hợp lệ.");
          return;
        }

        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setLocationStatus("success");
      },
      (error) => {
        handleLocationError(error.code === 1
          ? "Quyền truy cập vị trí đã bị từ chối."
          : error.code === 3
            ? "Lấy vị trí quá thời gian chờ."
            : "Không thể lấy vị trí GPS.");
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

    setFormMessage(nextMessage ? { text: nextMessage, type: "error" } : null);
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
      setFormMessage(null);
    } catch {
      cameraInputRef.current?.click();
      setFormMessage({ text: "Không mở được camera trực tiếp. Đã chuyển sang trình chọn ảnh/camera của thiết bị.", type: "error" });
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
      setFormMessage({ text: "Camera chưa sẵn sàng để chụp.", type: "error" });
      return;
    }

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      setFormMessage({ text: "Không thể đọc dữ liệu từ camera.", type: "error" });
      return;
    }

    context.drawImage(video, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setFormMessage({ text: "Không thể tạo ảnh từ camera.", type: "error" });
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
    setFormMessage(null);

    const normalizedDescription = description.trim();
    if (!normalizedDescription) {
      setFormMessage({ text: "Vui lòng nhập mô tả vụ việc.", type: "error" });
      return;
    }

    if (isOtherCategory && !normalizedCustomCategory) {
      setFormMessage({ text: "Nhập loại vụ việc khi chọn Khác.", type: "error" });
      return;
    }

    if (!hasValidLocation) {
      setFormMessage({ text: "Chưa có vị trí. Hãy bấm Cập nhật vị trí trước khi gửi.", type: "error" });
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("title", buildIncidentTitle(titleCategory, normalizedDescription));
    formData.append("detail", normalizedDescription);
    formData.append("category", category);
    if (isOtherCategory) {
      formData.append("customCategory", normalizedCustomCategory);
    }
    formData.append("latitude", String(lat));
    formData.append("longitude", String(lng));
    images.forEach((image) => {
      formData.append("images", image);
    });

    try {
      const result = await createIncidentWithImages(formData);

      setDescription("");
      setCustomCategory("");
      setImages([]);
      setFormMessage({ text: result?.Message || "Đã gửi báo cáo thành công.", type: "success" });
    } catch (error) {
      setFormMessage({ text: error instanceof Error ? error.message : "Không thể gửi báo cáo.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DashboardLayout
      activeUserTab={activeUserTab}
      decorVariant={decorVariant}
      onUserTabChange={handleUserTabChange}
      role="user"
    >
      {isNewsRoute ? (
        <UserNewsPage articleId={newsArticleId} />
      ) : tab === "home" ? (
        <>
          <section className="page-title citizen-title">
            <p className="eyebrow">Người dân</p>
            <h2>Báo cáo nhanh trong vài giây</h2>
            <span>Gửi báo cáo nhanh chóng và chính xác.</span>
          </section>

          <section className="citizen-home-grid">
            <MapView
              className="home-main-map"
              currentLocationLabel="Vị trí hiện tại của bạn"
              defaultToCurrentLocation
              role="user"
              showPoiInNormal={false}
              title="Vị trí hiện tại tại TP.HCM"
              variant="compact"
            />

            <form className="panel report-form quick-report-form" onSubmit={handleSubmit}>
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Báo cáo</span>
                  <h2>Gửi vụ việc</h2>
                </div>
              </div>

              <label className="field" htmlFor="incident-type">
                <span>Loại vụ việc</span>
                <select
                  id="incident-type"
                  value={category}
                  onChange={(event) => {
                    const nextCategory = event.target.value;
                    setCategory(nextCategory);
                    if (nextCategory !== "Khác") {
                      setCustomCategory("");
                    }
                  }}
                >
                  <option>Trộm cắp</option>
                  <option>Gây rối trật tự</option>
                  <option>Tai nạn giao thông</option>
                  <option>Bạo lực</option>
                  <option>Khác</option>
                </select>
              </label>

              {isOtherCategory ? (
                <label className="field" htmlFor="custom-category">
                  <span>Nhập loại vụ việc</span>
                  <input
                    id="custom-category"
                    name="customCategory"
                    value={customCategory}
                    placeholder="Ví dụ: Mất trẻ em"
                    onChange={(event) => setCustomCategory(event.target.value)}
                  />
                </label>
              ) : null}

              <label className="field" htmlFor="description">
                <span>Mô tả</span>
                <textarea
                  id="description"
                  name="description"
                  required
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
                  value={locationText}
                  aria-describedby={locationError ? "location-error" : undefined}
                />
                {locationError ? <small id="location-error">{locationError}</small> : null}
              </label>

              <div className="photo-actions">
                <button className="btn btn-secondary" type="button" onClick={() => void openLiveCamera()}>
                  Chụp ảnh
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => uploadInputRef.current?.click()}>
                  Chọn ảnh
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
                <small>Tối đa {MAX_IMAGES} ảnh JPG, PNG hoặc WEBP để hỗ trợ xác minh hiện trường.</small>
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
              {formMessage ? (
                <span
                  className={`form-message is-${formMessage.type}`}
                  role={formMessage.type === "success" ? "status" : "alert"}
                >
                  {formMessage.text}
                </span>
              ) : null}
            </form>
          </section>

          <section className="home-bottom-grid">
            <article className="panel emergency-card">
              <span className="eyebrow">Số khẩn cấp</span>
              {emergencyNumbers.map((item) => (
                <a
                  className={`emergency-number-card emergency-tone-${item.tone}`}
                  href={`tel:${item.number}`}
                  key={item.number}
                >
                  <span className="emergency-icon">
                    <AdminIcon name={item.icon} />
                  </span>
                  <span>{item.label}</span>
                  <strong>{item.number}</strong>
                  <small>{item.note}</small>
                </a>
              ))}
            </article>

            <article className="panel location-card">
              <div>
                <span className="eyebrow">Định vị</span>
                <h2>Vị trí hiện tại</h2>
                <p aria-live="polite">{locationText}</p>
                {locationError ? <p>{locationError}</p> : null}
              </div>
              <Button disabled={locationStatus === "loading"} type="button" variant="secondary" onClick={updateCurrentLocation}>
                Cập nhật vị trí
              </Button>
            </article>
          </section>
        </>
      ) : tab === "map" ? (
        <>
          <section className="page-title citizen-title">
            <p className="eyebrow">Bản đồ TP.HCM</p>
            <h2>Theo dõi khu vực và vụ việc</h2>
            <span>Theo dõi tình hình an ninh theo thời gian thực.</span>
          </section>

          <section className="citizen-map-wrapper">
            <MapView
              className="city-map-view"
              currentLocationLabel="Vị trí hiện tại của bạn"
              defaultToCurrentLocation
              role="user"
              showModeControls
              title="Bản đồ an ninh 3D"
              variant="full"
            />
          </section>
        </>
      ) : (
        <UserNewsPage />
      )}
    </DashboardLayout>
  );
}

export default UserDashboard;
