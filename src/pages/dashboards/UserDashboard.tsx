import { useEffect, useEffectEvent, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import Button from "../../components/common/Button";
import AdminIcon, { type AdminIconName } from "../../components/admin/AdminIcons";
import DashboardLayout from "../../components/layout/DashboardLayout";
import MapView from "../../components/map/MapView";
import UserNewsPage from "../news/UserNewsPage";
import { canStoreMapboxAddress, createIncidentWithImages, readIncidentPhotoMetadata, reverseIncidentAddress } from "../../services/userService";
import { getIncidentCreatedAt, getIncidentId, getIncidentStatus } from "../../types/incident";
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
type PhotoDetails = {
  capturedAt?: string;
  exifTime?: string;
  latitude?: number;
  longitude?: number;
  checking?: boolean;
};

function photoTimeLabel(photo?: PhotoDetails) {
  if (photo?.checking) return "Đang đọc thông tin ảnh…";
  if (photo?.capturedAt) return `${new Date(photo.capturedAt).toLocaleString("vi-VN")} · Giờ thiết bị`;
  if (photo?.exifTime) return `${photo.exifTime.replace("T", " ")} · EXIF, chưa xác định múi giờ`;
  return "Không xác định được thời gian chụp";
}

function UserDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const locationRequestIdRef = useRef(0);
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState<number | "">("");
  const [lng, setLng] = useState<number | "">("");
  const [locationStatus, setLocationStatus] = useState<"loading" | "success" | "error">("loading");
  const [locationError, setLocationError] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const imagesRef = useRef<File[]>([]);
  const captureInProgress = useRef(false);
  const submitInProgress = useRef(false);
  const submissionId = useRef<string | null>(null);
  const [photoDetails, setPhotoDetails] = useState(new Map<File, PhotoDetails>());
  const [address, setAddress] = useState("");
  const [addressLookup, setAddressLookup] = useState<{ key: string; value: string | null } | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [receivedAt, setReceivedAt] = useState("");
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
  const addressKey = `${lat},${lng}`;
  const suggestedAddress = hasValidLocation && addressLookup?.key === addressKey ? addressLookup.value : null;
  const reportAddress = address.trim() || (canStoreMapboxAddress ? suggestedAddress : null);
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

  const initializeLocation = useEffectEvent(() => updateCurrentLocation());
  useEffect(() => {
    initializeLocation();
  }, []);

  useEffect(() => {
    if (typeof lat !== "number" || typeof lng !== "number") return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    let active = true;
    void reverseIncidentAddress(lat, lng, controller.signal)
      .then((value) => { if (active) setAddressLookup({ key: addressKey, value }); })
      .catch(() => { if (active) setAddressLookup({ key: addressKey, value: null }); })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [lat, lng, addressKey]);

  useEffect(
    () => () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    },
    [imagePreviews],
  );

  useEffect(() => stopCameraStream, []);

  useEffect(() => {
    if (!isCameraOpen || !videoRef.current || !streamRef.current) {
      return;
    }

    videoRef.current.srcObject = streamRef.current;
    void videoRef.current.play().catch(() => undefined);
  }, [isCameraOpen]);

  function updateCurrentLocation(photos: Promise<File[]> | null = null) {
    const requestId = ++locationRequestIdRef.current;
    setLocationStatus("loading");
    setLocationError("");
    setLat("");
    setLng("");
    setConfirmed(false);

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
        if (getLocationText(position.coords.latitude, position.coords.longitude)) {
          void photos?.then((files) => files.forEach((file) => updatePhotoDetails(file, {
            latitude: position.coords.latitude, longitude: position.coords.longitude,
          })));
        }
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
      { enableHighAccuracy: true, maximumAge: photos ? 0 : 60000, timeout: 10000 },
    );
  }

  function updatePhotoDetails(file: File, details: PhotoDetails) {
    setPhotoDetails((current) => {
      if (!imagesRef.current.includes(file)) return current;
      return new Map(current).set(file, { ...current.get(file), ...details });
    });
  }

  function validateAndAppendImages(selectedImages: File[], capturedAt?: string) {
    let nextMessage = "";
    const nextImages = [...imagesRef.current];
    const added: File[] = [];

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
      added.push(image);
    }

    setFormMessage(nextMessage ? { text: nextMessage, type: "error" } : null);
    imagesRef.current = nextImages;
    setImages(nextImages);
    if (added.length === 0) return added;
    setConfirmed(false);
    for (const file of added) {
      updatePhotoDetails(file, { capturedAt, checking: !capturedAt });
      if (!capturedAt) {
        void readIncidentPhotoMetadata(file)
          .then((result) => updatePhotoDetails(file, { exifTime: result?.capturedAt ?? undefined, checking: false }))
          .catch(() => updatePhotoDetails(file, { checking: false }));
      }
    }
    return added;
  }

  function handleImagesSelected(event: ChangeEvent<HTMLInputElement>) {
    const selectedImages = Array.from(event.target.files || []);
    const added = validateAndAppendImages(selectedImages);
    if (added.length) updateCurrentLocation(Promise.resolve(added));
    event.target.value = "";
  }

  function removeImage(index: number) {
    const removed = imagesRef.current[index];
    imagesRef.current = imagesRef.current.filter((_, currentIndex) => currentIndex !== index);
    setImages(imagesRef.current);
    setPhotoDetails((current) => {
      const next = new Map(current);
      next.delete(removed);
      return next;
    });
    setConfirmed(false);
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

    if (!video || !canvas || captureInProgress.current || submitInProgress.current) {
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

    captureInProgress.current = true;
    const capturedAt = new Date().toISOString();
    // Start GPS when the shutter fires, before image encoding finishes.
    let resolvePhotos: (files: File[]) => void = () => undefined;
    const photos = new Promise<File[]>((resolve) => { resolvePhotos = resolve; });
    updateCurrentLocation(photos);
    context.drawImage(video, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        captureInProgress.current = false;
        if (!blob) {
          resolvePhotos([]);
          setFormMessage({ text: "Không thể tạo ảnh từ camera.", type: "error" });
          return;
        }

        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
        resolvePhotos(validateAndAppendImages([file], capturedAt));
        closeLiveCamera();
      },
      "image/jpeg",
      0.92,
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitInProgress.current || captureInProgress.current || !confirmed) return;
    setFormMessage(null);

    const normalizedDescription = description.trim();
    if (!category) {
      setFormMessage({ text: "Vui lòng chọn loại vụ việc.", type: "error" });
      return;
    }
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

    submitInProgress.current = true;
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
    submissionId.current ??= crypto.randomUUID();
    formData.append("submissionId", submissionId.current);
    if (reportAddress) formData.append("address", reportAddress);
    formData.append("photoMetadata", JSON.stringify(images.map((file) => {
      const photo = photoDetails.get(file);
      return { capturedAt: photo?.capturedAt, latitude: photo?.latitude, longitude: photo?.longitude };
    })));
    images.forEach((image) => {
      formData.append("images", image);
    });

    try {
      const result = await createIncidentWithImages(formData);
      const incident = result?.Incident ?? result?.incident;

      setDescription("");
      setCustomCategory("");
      setCategory("");
      setAddress("");
      setConfirmed(false);
      imagesRef.current = [];
      setPhotoDetails(new Map());
      setImages([]);
      submissionId.current = null;
      setReceivedAt(incident ? getIncidentCreatedAt(incident) : "");
      setFormMessage({
        text: incident ? `Đã gửi báo cáo. Mã ${getIncidentId(incident)} · ${getIncidentStatus(incident)}`
          : result?.Message || result?.message || "Đã gửi báo cáo thành công.",
        type: "success",
      });
    } catch (error) {
      setFormMessage({ text: error instanceof Error ? error.message : "Không thể gửi báo cáo.", type: "error" });
    } finally {
      submitInProgress.current = false;
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
            <p className="eyebrow">Báo cáo sự cố</p>
            <h2>Chụp ảnh. Chúng tôi hỗ trợ phần còn lại.</h2>
            <span>Gửi thông tin hiện trường nhanh chóng, giảm thao tác nhập liệu.</span>
          </section>

          <ol className="citizen-report-steps" aria-label="Các bước gửi báo cáo">
            {["Chụp ảnh", "Thu thập", "Kiểm tra", "Hoàn tất"].map((label, index) => {
              const currentStep = formMessage?.type === "success" ? 4
                : images.some((file) => photoDetails.get(file)?.checking) ? 2
                  : images.length || description ? 3 : 1;
              const complete = index + 1 < currentStep;
              return (
                <li className={index + 1 === currentStep ? "is-current" : complete ? "is-complete" : ""} key={label}>
                  <span>{complete ? <AdminIcon name="check" /> : index + 1}</span>
                  <strong>{label}</strong>
                </li>
              );
            })}
          </ol>

          <section className="citizen-report-layout">
            <form className="panel report-form quick-report-form" onSubmit={handleSubmit}>
              <div className="citizen-report-intro">
                <span className="citizen-ai-badge"><AdminIcon name="activity" /> Hỗ trợ ghi nhận</span>
                <h2>Ghi nhận hiện trường bằng hình ảnh</h2>
                <p>Chụp ảnh và thêm thông tin cần thiết. Vị trí được lấy từ thiết bị; hệ thống chưa phân tích ảnh bằng AI.</p>
              </div>
              <fieldset className="citizen-report-body capture-fields" disabled={isSubmitting}>
              <div className="photo-actions">
                <button className="btn btn-secondary" type="button" onClick={() => void openLiveCamera()}>
                  <AdminIcon name="camera" />
                  Chụp ảnh
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => uploadInputRef.current?.click()}>
                  <AdminIcon name="image" />
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
                  {imagePreviews.map((preview, index) => {
                    const photo = photoDetails.get(images[index]);
                    const photoLocation = getLocationText(photo?.latitude ?? "", photo?.longitude ?? "");
                    return (
                    <figure key={`${preview.name}-${preview.url}`}>
                      <img src={preview.url} alt={`Ảnh báo cáo ${index + 1}`} />
                      <figcaption>
                        {photoTimeLabel(photo)}
                        <br />
                        {photoLocation
                          ? `${photo?.capturedAt ? "GPS khi bấm chụp" : "GPS khi chọn ảnh"}: ${photoLocation}`
                          : "Chưa ghi nhận GPS cho ảnh"}
                      </figcaption>
                      <button type="button" onClick={() => removeImage(index)}>
                        Xóa
                      </button>
                    </figure>
                    );
                  })}
                </div>
              ) : null}

              <div className="section-heading">
                <div>
                  <span className="eyebrow">Xem trước báo cáo</span>
                  <h2>Kiểm tra thông tin sự cố</h2>
                  <p>AI phân tích ảnh chưa khả dụng. Bạn có thể chọn loại vụ việc và mô tả để gửi báo cáo.</p>
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
                    setConfirmed(false);
                    if (nextCategory !== "Khác") {
                      setCustomCategory("");
                    }
                  }}
                >
                  <option value="" disabled>Chọn loại vụ việc</option>
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
                    maxLength={120}
                    onChange={(event) => { setCustomCategory(event.target.value); setConfirmed(false); }}
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
                  maxLength={4000}
                  onChange={(event) => { setDescription(event.target.value); setConfirmed(false); }}
                />
              </label>

              <label className="field" htmlFor="report-address">
                <span>Địa chỉ đầy đủ</span>
                <input id="report-address" maxLength={500} value={address || reportAddress || ""}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, thành phố"
                  onChange={(event) => { setAddress(event.target.value); setConfirmed(false); }} />
                <small aria-live="polite">
                  {!hasValidLocation ? "Cần GPS để tra địa chỉ tự động."
                    : addressLookup?.key !== addressKey ? "Đang tra địa chỉ…"
                    : suggestedAddress && !canStoreMapboxAddress ? `Tham khảo từ Mapbox: ${suggestedAddress}. Vui lòng nhập địa chỉ bạn xác nhận để lưu.`
                    : suggestedAddress ? "Địa chỉ gợi ý từ Mapbox. Bạn có thể chỉnh sửa."
                    : "Không tìm thấy địa chỉ. Bạn có thể nhập địa chỉ hoặc tiếp tục với tọa độ GPS."}
                </small>
              </label>

              <label className="field" htmlFor="location">
                <span>Vị trí (tự động)</span>
                <input
                  id="location"
                  readOnly
                  value={locationText}
                  aria-describedby={locationError ? "location-error" : undefined}
                />
                {locationError ? <small id="location-error">{locationError}</small> : null}
              </label>

              <dl className="capture-preview">
                <div><dt>Người gửi</dt><dd>{user?.name || user?.email || "Người dân"}</dd></div>
                <div><dt>Loại sự cố do AI đề xuất</dt><dd>Chưa có kết quả nhận diện</dd></div>
                <div><dt>Độ tin cậy</dt><dd>Chưa có dữ liệu độ tin cậy</dd></div>
                {!images.length && <div><dt>Thời gian chụp</dt><dd>Chưa có ảnh</dd></div>}
              </dl>
              <label className="capture-confirm">
                <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
                Tôi đã kiểm tra thông tin và xác nhận gửi báo cáo.
              </label>
              <Button disabled={isSubmitting || !confirmed || !hasValidLocation} type="submit">
                <AdminIcon name={isSubmitting ? "activity" : "send"} />
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
              </fieldset>
            </form>

            <aside className="citizen-support-panel">
              <div className="citizen-support-heading"><span className="eyebrow">Thông tin tự động</span><h2>Hệ thống đang hỗ trợ bạn</h2></div>
              <article className="citizen-support-item"><span className="citizen-support-icon"><AdminIcon name="user" /></span><div><small>Người báo cáo</small><strong>{user?.name || user?.email || "Người dân"}</strong><span>Từ tài khoản đang đăng nhập</span></div></article>
              <article className="citizen-support-location">
                <div className="citizen-support-item"><span className="citizen-support-icon is-location"><AdminIcon name="mapPin" /></span><div><small>Vị trí ghi nhận báo cáo</small><strong aria-live="polite">{locationText}</strong></div><button type="button" disabled={locationStatus === "loading" || isSubmitting} onClick={() => updateCurrentLocation()}>Cập nhật</button></div>
                <MapView className="citizen-mini-map" currentLocationLabel="Vị trí hiện tại của bạn" defaultToCurrentLocation role="user" showPoiInNormal={false} title="Vị trí hiện tại trên bản đồ" variant="compact" />
              </article>
              <article className="citizen-support-item"><span className="citizen-support-icon is-time"><AdminIcon name="clock" /></span><div><small>Thời gian tiếp nhận</small><strong>{receivedAt ? new Date(receivedAt).toLocaleString("vi-VN") : "Chờ gửi báo cáo"}</strong></div></article>
              <div className="citizen-emergency-links"><span className="eyebrow">Số khẩn cấp</span>{emergencyNumbers.map((item) => <a href={`tel:${item.number}`} key={item.number}><AdminIcon name={item.icon} /> {item.label} <strong>{item.number}</strong></a>)}</div>
            </aside>
          </section>

        </>
      ) : tab === "map" ? (
        <>
          <section className="page-title citizen-title">
            <p className="eyebrow">Bản đồ TP.HCM</p>
            <h2>Theo dõi khu vực và vụ việc</h2>
            <span>Theo dõi tình hình an ninh theo thời gian thực</span>
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
