import { Link } from "react-router-dom";
import LegalPage from "./LegalPage";
import SupportContact from "./SupportContact";

function SupportPage() {
  return (
    <LegalPage title="Hỗ trợ">
      <p>
        Ứng dụng là dự án độc lập, không phải ứng dụng chính thức của cơ quan Công an.{" "}
        <strong>Trong trường hợp khẩn cấp, hãy gọi ngay 113.</strong>
      </p>

      <h2>Câu hỏi thường gặp</h2>
      <h3>Tôi không đăng nhập được</h3>
      <p>
        Kiểm tra kết nối mạng, sau đó thử lại bằng email và mật khẩu hoặc tài khoản Google/Apple. Nếu tài khoản bị khóa,
        hãy liên hệ chúng tôi.
      </p>
      <h3>Bản đồ không hiện vị trí của tôi</h3>
      <p>Vào Cài đặt của điện thoại, chọn ứng dụng và cho phép truy cập Vị trí khi dùng ứng dụng.</p>
      <h3>Làm sao để xóa tài khoản?</h3>
      <p>
        Đăng nhập, mở menu và chọn <strong>Xóa tài khoản</strong>. Xem thêm tại{" "}
        <Link to="/privacy">Chính sách quyền riêng tư</Link>.
      </p>

      <h2>Liên hệ</h2>
      <p>
        Gửi câu hỏi hoặc báo lỗi cho <SupportContact />.
      </p>
    </LegalPage>
  );
}

export default SupportPage;
