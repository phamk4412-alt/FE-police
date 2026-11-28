import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../../../services/api";
import type { PoliceShift, PoliceShiftStatus } from "../../../types/policeShift";

const shiftEndpoint = "/api/police/online/shift";

export function usePoliceShift() {
  const [shift, setShift] = useState<PoliceShift | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const saving = useRef(false);
  const latestRequest = useRef(0);

  useEffect(() => {
    let active = true;
    let reading = false;

    async function readShift() {
      if (saving.current || reading) return;
      reading = true;
      const request = ++latestRequest.current;
      try {
        const current = await apiFetch<PoliceShift>(shiftEndpoint, { cache: "no-store" });
        if (active && request === latestRequest.current) setShift(current);
      } catch {
        if (active && request === latestRequest.current) setShift(null);
      } finally {
        reading = false;
      }
    }

    void readShift();
    const timer = window.setInterval(readShift, 5_000);
    window.addEventListener("online", readShift);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("online", readShift);
    };
  }, []);

  async function updateShift(status: PoliceShiftStatus) {
    if (saving.current) return false;
    saving.current = true;
    latestRequest.current++;
    setIsSaving(true);
    setError("");
    try {
      const updated = await apiFetch<PoliceShift>(shiftEndpoint, {
        method: "PUT",
        body: JSON.stringify({ Status: status }),
      });
      setShift(updated);
      return true;
    } catch {
      setError("Không thể cập nhật ca trực. Vui lòng thử lại.");
      return false;
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  }

  return { shift, error, isSaving, updateShift };
}
