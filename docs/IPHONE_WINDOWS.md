# Cài app lên iPhone từ máy Windows (miễn phí)

Không cần máy Mac, không cần trả phí Apple. GitHub build file app (`.ipa`) giúp, rồi bạn dùng **Sideloadly** trên Windows để cài vào iPhone bằng Apple ID thường.

Giới hạn của cách miễn phí:
- App chạy được **7 ngày**. Hết hạn thì cắm iPhone vào máy tính và cài lại (bước 4), không mất dữ liệu.
- Mỗi Apple ID cài được tối đa 3 app kiểu này cùng lúc.
- Trong app, đăng nhập bằng **email + mật khẩu**. Nút Google cần cấu hình thêm (xem `docs/MOBILE_APP.md`).

## Bước 1. Cài phần mềm trên Windows (một lần)

1. **iTunes** và **iCloud** bản tải từ trang Apple (không lấy bản Microsoft Store):
   - https://www.apple.com/itunes/download/win64
   - https://support.apple.com/en-us/103232 (iCloud cho Windows)
   Sideloadly cần hai phần mềm này để nhận iPhone và đăng nhập Apple ID.
2. **Sideloadly**: https://sideloadly.io → Download for Windows → cài đặt.

## Bước 2. Tải file app từ GitHub

1. Vào https://github.com/phamk4412-alt/FE-police/actions/workflows/ios-build.yml (đăng nhập GitHub).
2. Muốn build mới: bấm **Run workflow** → **Run workflow**. Chờ khoảng 5–10 phút đến khi có dấu ✅ xanh.
3. Bấm vào lần chạy có dấu ✅ → kéo xuống mục **Artifacts** → bấm **police-app-ipa** để tải về.
4. Giải nén file `.zip` vừa tải, bên trong là **police-app.ipa**.

## Bước 3. Chuẩn bị iPhone

1. Cắm iPhone vào laptop bằng cáp. Trên iPhone bấm **Tin cậy** và nhập mật mã.
2. Bật **Chế độ nhà phát triển** (iOS 16 trở lên): **Cài đặt → Quyền riêng tư & Bảo mật → Chế độ nhà phát triển** → bật → iPhone khởi động lại → bấm **Bật**.
   Nếu chưa thấy mục này, làm bước 4 một lần, mục sẽ xuất hiện.

## Bước 4. Cài app bằng Sideloadly

1. Mở **Sideloadly**.
2. Kéo file **police-app.ipa** vào ô có biểu tượng IPA (hoặc bấm vào ô đó để chọn file).
3. Ô **iDevice**: chọn iPhone của bạn.
4. Ô **Apple account**: nhập email Apple ID.
5. Bấm **Start**, nhập mật khẩu Apple ID (và mã xác thực 2 lớp nếu được hỏi).
6. Chờ đến khi hiện **Done**.

## Bước 5. Tin cậy app trên iPhone (lần đầu)

**Cài đặt → Cài đặt chung → Quản lý VPN & Thiết bị** → chọn email Apple ID của bạn → **Tin cậy**.

Giờ mở app trên màn hình chính như app bình thường.

## Gia hạn sau 7 ngày

Cắm iPhone vào laptop, mở Sideloadly, làm lại bước 4 với cùng file `.ipa`.

## Lỗi thường gặp

| Lỗi | Cách xử lý |
| --- | --- |
| Sideloadly không thấy iPhone | Cài iTunes bản từ trang Apple (bước 1), cắm lại cáp, bấm Tin cậy trên iPhone |
| `Your maximum App ID limit has been reached` | Apple ID miễn phí chỉ tạo được 10 App ID mỗi 7 ngày; chờ vài ngày hoặc dùng Apple ID khác |
| `Guru Meditation` / lỗi đăng nhập | Đăng nhập lại iCloud trên Windows, tắt VPN, thử lại |
| App mở ra rồi tắt ngay | Làm bước 5 (Tin cậy) và bật Chế độ nhà phát triển (bước 3) |
| Màn hình "Không có kết nối mạng" | App tải trang warteam.website nên cần Internet |
