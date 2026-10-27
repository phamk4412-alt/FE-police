const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || "";

function SupportContact() {
  return SUPPORT_EMAIL ? (
    <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
  ) : (
    <span>quản trị viên hệ thống</span>
  );
}

export default SupportContact;
