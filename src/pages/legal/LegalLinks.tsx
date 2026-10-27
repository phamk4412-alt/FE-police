import { Link } from "react-router-dom";

// App Store review needs the privacy policy reachable in the app and a clear note that this is not a government app.
function LegalLinks() {
  return (
    <div className="legal-links">
      <p>Dự án độc lập, không phải ứng dụng chính thức của cơ quan Công an.</p>
      <nav aria-label="Thông tin pháp lý">
        <Link to="/privacy">Chính sách quyền riêng tư</Link>
        <span aria-hidden="true">·</span>
        <Link to="/help">Hỗ trợ</Link>
      </nav>
    </div>
  );
}

export default LegalLinks;
