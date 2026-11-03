import { useState } from "react";
import AdminIcon from "../../../components/admin/AdminIcons";
import PoliceDialog from "./PoliceDialog";

export default function PoliceShiftPanel() {
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);

  function endShift() {
    setStartedAt(null);
    setConfirmEnd(false);
  }

  return (
    <section className="police-shift-panel" aria-labelledby="police-shift-heading">
      <div className="police-shift-content">
        <span className="police-shift-icon" aria-hidden="true"><AdminIcon name="clock" /></span>
        <div>
          <p className="police-eyebrow">Ca trực · Mô phỏng giao diện</p>
          <h3 id="police-shift-heading">Quản lý ca trực</h3>
          <div className="police-shift-status" role="status" aria-live="polite" aria-atomic="true">
            <span className={`police-shift-badge ${startedAt ? "is-active" : ""}`}>
              <span aria-hidden="true" />{startedAt ? "Đang trong ca" : "Chưa vào ca"}
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
      {startedAt ? (
        <button className="police-button" type="button" onClick={() => setConfirmEnd(true)}>Kết thúc ca trực</button>
      ) : (
        <button className="police-button police-button-primary" type="button" onClick={() => setStartedAt(new Date())}>Bắt đầu ca trực</button>
      )}
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
