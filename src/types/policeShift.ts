export const policeShiftLabels = {
  "off-duty": "Chưa vào ca",
  "on-duty": "Đang trong ca",
  break: "Tạm nghỉ",
} as const;

export type PoliceShiftStatus = keyof typeof policeShiftLabels;

export interface PoliceShift {
  Status: PoliceShiftStatus;
  StartedAt: string | null;
}

export function getPoliceShiftLabel(status?: PoliceShiftStatus) {
  return (status && policeShiftLabels[status]) || "Chưa rõ trạng thái ca";
}
