import { useState } from "react";
import AdminIcon from "../../../components/admin/AdminIcons";
import { getPoliceShiftLabel, type PoliceShift, type PoliceShiftStatus } from "../../../types/policeShift";
import PoliceDialog from "./PoliceDialog";

interface PoliceShiftPanelProps {
  shift: PoliceShift | null;
  error: string;
  isSaving: boolean;
  updateShift: (status: PoliceShiftStatus) => Promise<boolean>;
}

export default function PoliceShiftPanel({ shift, error, isSaving, updateShift }: PoliceShiftPanelProps) {
  const [confirmEnd, setConfirmEnd] = useState(false);

  async function endShift() {
    if (await updateShift("off-duty")) setConfirmEnd(false);
  }

  const status = shift?.Status;
  const startedAt = shift?.StartedAt;

  return (
    <section className="police-shift-panel" aria-labelledby="police-shift-heading">
      <div className="police-shift-content">
        <span className="police-shift-icon" aria-hidden="true"><AdminIcon name="clock" /></span>
        <div>
          <p className="police-eyebrow">Ca trực</p>
          <h3 id="police-shift-heading">Quản lý ca trực</h3>
          <div className="police-shift-status" role="status" aria-live="polite" aria-atomic="true">
            <span className={`police-shift-badge is-${status ?? "off-duty"}`}>
              <span aria-hidden="true" />{getPoliceShiftLabel(status)}
            </span>
            {startedAt ? (
              <span className="police-shift-started">
                Bắt đầu lúc <time dateTime={startedAt}>{new Intl.DateTimeFormat("vi-VN", {
                  dateStyle: "medium", timeStyle: "medium", timeZone: "Asia/Ho_Chi_Minh",
                }).format(new Date(startedAt))}</time>
              </span>
            ) : null}
          </div>
          {isSaving ? <p className="police-shift-note" role="status">Đang cập nhật ca trực…</p> : null}
          {error && !confirmEnd ? <p className="police-shift-note" role="alert">{error}</p> : null}
        </div>
      </div>
      <div className="police-shift-actions">
        {status === "off-duty" ? (
          <button className="police-button police-button-primary" type="button" disabled={isSaving} onClick={() => void updateShift("on-duty")}><AdminIcon name="play" />Bắt đầu ca trực</button>
        ) : null}
        {status === "on-duty" ? (
          <button className="police-button police-button-pause" type="button" disabled={isSaving} onClick={() => void updateShift("break")}><AdminIcon name="pause" />Tạm nghỉ</button>
        ) : null}
        {status === "break" ? (
          <button className="police-button police-button-resume" type="button" disabled={isSaving} onClick={() => void updateShift("on-duty")}><AdminIcon name="play" />Tiếp tục ca trực</button>
        ) : null}
        {status && status !== "off-duty" ? (
          <button className="police-button police-button-end" type="button" disabled={isSaving} onClick={() => setConfirmEnd(true)}><AdminIcon name="stop" />Kết thúc ca trực</button>
        ) : null}
      </div>
      {confirmEnd ? (
        <PoliceDialog title="Kết thúc ca trực?" eyebrow="Xác nhận thao tác" onClose={() => setConfirmEnd(false)}>
          <div className="police-dialog-body">
            <p className="police-detail-description">Bạn muốn kết thúc ca trực và chuyển về trạng thái “Chưa vào ca”?</p>
            {error ? <p className="police-shift-note" role="alert">{error}</p> : null}
          </div>
          <footer className="police-dialog-footer">
            <button className="police-button" type="button" autoFocus onClick={() => setConfirmEnd(false)}><AdminIcon name="close" />Hủy</button>
            <button className="police-button police-button-primary" type="button" disabled={isSaving} onClick={() => void endShift()}><AdminIcon name="check" />{isSaving ? "Đang cập nhật…" : "Xác nhận kết thúc"}</button>
          </footer>
        </PoliceDialog>
      ) : null}
    </section>
  );
}
