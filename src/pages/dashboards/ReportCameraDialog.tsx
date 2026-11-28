import { useEffect, useId, useRef, useState, type RefObject } from "react";
import AdminIcon from "../../components/admin/AdminIcons";
import Button from "../../components/common/Button";
import { ReportPhotoStamp } from "./ReportPhotoDialog";

interface ReportCameraDialogProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  cameraState: "opening" | "ready" | "error";
  cameraError: string;
  isCapturing: boolean;
  reporter: string;
  coordinates: string;
  address: string;
  onClose: () => void;
  onCapture: () => void;
  onUseDeviceCamera: () => void;
}

export default function ReportCameraDialog({
  videoRef, canvasRef, cameraState, cameraError, isCapturing,
  reporter, coordinates, address, onClose, onCapture, onUseDeviceCamera,
}: ReportCameraDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [frameReady, setFrameReady] = useState(false);
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const isReady = cameraState === "ready" && frameReady;

  return (
    <dialog className="report-photo-dialog report-camera-dialog" ref={dialogRef} aria-labelledby={titleId} onClose={onClose}>
      <header className="report-photo-header">
        <h2 id={titleId}><AdminIcon name="camera" /> Chụp ảnh hiện trường</h2>
        <Button variant="ghost" type="button" onClick={() => dialogRef.current?.close()}><AdminIcon name="close" /> Đóng camera</Button>
      </header>
      <div className="report-photo-stage">
        <div className="report-camera-frame">
          <video ref={videoRef} autoPlay muted playsInline onPlaying={() => setFrameReady(true)} />
          {!isReady && (
            <p className="report-camera-status" role="status">
              {cameraState === "error" ? "Không mở được camera trực tiếp." : "Đang mở camera…"}
            </p>
          )}
          <div className="report-photo-stamp">
            <ReportPhotoStamp reporter={reporter}
              time={clock.toLocaleString("vi-VN")} coordinates={coordinates}
              positionLabel="GPS hiện tại" address={address} />
          </div>
        </div>
        <canvas ref={canvasRef} className="visually-hidden" />
      </div>
      <footer className="report-photo-footer report-camera-footer">
        <p>Thời gian và GPS của ảnh được ghi nhận khi bạn bấm chụp.</p>
        {cameraState === "error" ? (
          <Button type="button" onClick={() => { dialogRef.current?.close(); onUseDeviceCamera(); }}>
            <AdminIcon name="camera" /> Dùng camera thiết bị
          </Button>
        ) : (
          <Button type="button" disabled={!isReady || isCapturing} onClick={onCapture}>
            <AdminIcon name="camera" /> {isCapturing ? "Đang lưu ảnh…" : "Chụp khung hình"}
          </Button>
        )}
        {cameraError ? <p role="alert">{cameraError}</p> : null}
      </footer>
    </dialog>
  );
}
