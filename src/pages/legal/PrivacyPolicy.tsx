import LegalPage from "./LegalPage";
import SupportContact from "./SupportContact";

function PrivacyPolicy() {
  return (
    <LegalPage title="Chính sách quyền riêng tư">
      <p className="legal-updated">Cập nhật ngày 27/10/2026</p>
      <p>
        Ứng dụng là dự án độc lập phục vụ học tập và thử nghiệm, không phải ứng dụng chính thức của cơ quan Công an.
        Trang này giải thích dữ liệu nào được thu thập, dùng để làm gì và cách bạn xóa dữ liệu.
      </p>

      <h2>Dữ liệu chúng tôi thu thập</h2>
      <ul>
        <li>
          <strong>Thông tin tài khoản:</strong> họ tên, email, ảnh đại diện (khi đăng nhập bằng Google) và mật khẩu đã
          mã hóa (khi đăng ký bằng email). Đăng nhập bằng Apple có thể dùng email ẩn do Apple cung cấp.
        </li>
        <li>
          <strong>Báo cáo sự cố:</strong> nội dung mô tả, loại sự cố, hình ảnh bạn chụp hoặc chọn, số điện thoại bạn
          nhập và vị trí của sự cố.
        </li>
        <li>
          <strong>Vị trí:</strong> chỉ lấy khi bạn đang dùng ứng dụng, để gắn vị trí vào báo cáo và hiển thị bản đồ. Với
          tài khoản cảnh sát, vị trí được gửi định kỳ khi đang trực để điều phối.
        </li>
        <li>
          <strong>Nhật ký hệ thống:</strong> thời gian đăng nhập, thao tác quản trị và địa chỉ IP, dùng để bảo mật và
          điều tra lạm dụng.
        </li>
      </ul>

      <h2>Mục đích sử dụng</h2>
      <p>
        Dữ liệu chỉ dùng để vận hành ứng dụng: xác thực tài khoản, tiếp nhận và điều phối xử lý sự cố, hiển thị bản đồ.
        Chúng tôi không bán dữ liệu, không dùng cho quảng cáo và không theo dõi bạn trên ứng dụng khác.
      </p>

      <h2>Bên thứ ba</h2>
      <ul>
        <li>Google và Apple: xác thực khi bạn chọn đăng nhập bằng tài khoản của họ.</li>
        <li>Mapbox: hiển thị bản đồ và chỉ đường.</li>
        <li>Vercel và Render: lưu trữ trang web và máy chủ.</li>
      </ul>

      <h2>Lưu trữ và xóa dữ liệu</h2>
      <p>
        Dữ liệu được lưu đến khi bạn xóa tài khoản. Bạn có thể xóa tài khoản bất kỳ lúc nào trong ứng dụng: mở menu,
        chọn <strong>Xóa tài khoản</strong>. Thông tin tài khoản bị xóa ngay; báo cáo sự cố đã gửi có thể được giữ lại
        ở dạng không gắn với tài khoản để phục vụ hồ sơ xử lý.
      </p>

      <h2>Quyền của bạn</h2>
      <p>
        Bạn có thể từ chối quyền vị trí hoặc camera trong Cài đặt của điện thoại; khi đó các tính năng liên quan sẽ không
        hoạt động. Mọi yêu cầu về dữ liệu, vui lòng liên hệ <SupportContact />.
      </p>
    </LegalPage>
  );
}

export default PrivacyPolicy;
