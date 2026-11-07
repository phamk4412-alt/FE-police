import { useState } from "react";
import AdminIcon from "../../../components/admin/AdminIcons";
import PoliceDialog from "./PoliceDialog";

type ShiftState =
  | { status: "off-duty" }
  | { status: "on-duty"; startedAt: Date }
  | { status: "break"; startedAt: Date };

const shiftLabels: Record<ShiftState["status"], string> = {
  "off-duty": "Chưa vào ca",
  "on-duty": "Đang trong ca",
  break: "Tạm nghỉ",
};

export default function PoliceShiftPanel() {
  const [shift, setShift] = useState<ShiftState>({ status: "off-duty" });
  const [confirmEnd, setConfirmEnd] = useState(false);

  function endShift() {
    setShift({ status: "off-duty" });
    setConfirmEnd(false);
  }

  function startShift() {
    setShift({ status: "on-duty", startedAt: new Date() });
  }

  function pauseShift() {
    setShift((current) => current.status === "on-duty"
      ? { status: "break", startedAt: current.startedAt }
      : current);
  }

  function resumeShift() {
    setShift((current) => current.status === "break"
      ? { status: "on-duty", startedAt: current.startedAt }
      : current);
  }

  const isOffDuty = shift.status === "off-duty";
  const startedAt = isOffDuty ? null : shift.startedAt;

  return (
    <section className="police-shift-panel" aria-labelledby="police-shift-heading">
      <div className="police-shift-content">
        <span className="police-shift-icon" aria-hidden="true"><AdminIcon name="clock" /></span>
        <div>
          <p className="police-eyebrow">Ca trực · Mô phỏng giao diện</p>
          <h3 id="police-shift-heading">Quản lý ca trực</h3>
          <div className="police-shift-status" role="status" aria-live="polite" aria-atomic="true">
            <span className={`police-shift-badge is-${shift.status}`}>
              <span aria-hidden="true" />{shiftLabels[shift.status]}
            </span>
            {startedAt ? (
              <span className="police-shift-started">
                Bắt đầu lúc <time dateTime={startedAt.toISOString()}>{new Intl.DateTimeFormat("vi-VN", {
                  dateStyle: "medium", timeStyle: "medium", timeZone: "Asia/Ho_Chi_Minh",
                }).format(startedAt)}</time>
              </span>
            ) : null}
          </div>
          <p className="police-shift-note">Chỉ mô phỏng trên giao diện, không lưu sau khi tải lại. Độc lập với kết nối và chia sẻ vị trí GPS.</p>
        </div>
      </div>
      <div className="police-shift-actions">
        {shift.status === "off-duty" ? (
          <button className="police-button police-button-primary" type="button" onClick={startShift}>Bắt đầu ca trực</button>
        ) : shift.status === "on-duty" ? (
          <>
            <button className="police-button police-button-pause" type="button" onClick={pauseShift}>Tạm nghỉ</button>
            <button className="police-button police-button-end" type="button" onClick={() => setConfirmEnd(true)}>Kết thúc ca trực</button>
          </>
        ) : (
          <button className="police-button police-button-resume" type="button" onClick={resumeShift}>Tiếp tục ca trực</button>
        )}
      </div>
      {confirmEnd ? (
        <PoliceDialog title="Kết thúc ca trực?" eyebrow="Xác nhận thao tác" onClose={() => setConfirmEnd(false)}>
          <div className="police-dialog-body">
            <p className="police-detail-description">Bạn muốn kết thúc ca trực mô phỏng và chuyển về trạng thái “Chưa vào ca”?</p>
          </div>
          <footer className="police-dialog-footer">
            <button className="police-button" type="button" autoFocus onClick={() => setConfirmEnd(false)}>Hủy</button>
            <button className="police-button police-button-primary" type="button" onClick={endShift}>Xác nhận kết thúc</button>
          </footer>
        </PoliceDialog>
      ) : null}
    </section>
  );
}
