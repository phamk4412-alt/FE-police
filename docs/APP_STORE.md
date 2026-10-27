# Đưa app lên App Store

Repo đã có sẵn những thứ Apple kiểm tra khi duyệt app. Phần còn lại phải làm trên tài khoản Apple của bạn.

## Đã có trong repo

| Yêu cầu của Apple | Ở đâu |
| --- | --- |
| Có Google thì phải có **Đăng nhập bằng Apple** (guideline 4.8) | Nút Apple chỉ hiện trong app iPhone (`src/auth/AppleSignInButton.tsx`), backend `POST /api/auth/apple`, quyền `ios/App/App/App.entitlements` |
| Tạo được tài khoản thì phải **xóa được tài khoản** ngay trong app (5.1.1(v)) | Menu → **Xóa tài khoản**, backend `DELETE /api/auth/me` |
| **Chính sách quyền riêng tư** và trang **hỗ trợ** | `/privacy` và `/help`, có link ở trang đăng nhập/đăng ký |
| Không được giống app của cơ quan nhà nước | Tên "Police Smart Hub", icon không dùng huy hiệu Công an, dòng "Dự án độc lập, không phải ứng dụng chính thức của cơ quan Công an" ở trang đăng nhập |
| Lý do xin quyền camera, micro, vị trí | `ios/App/App/Info.plist` |
| Privacy manifest | `ios/App/App/PrivacyInfo.xcprivacy` |
| Khai báo mã hóa (để khỏi hỏi mỗi lần nộp) | `ITSAppUsesNonExemptEncryption = NO` trong `Info.plist` |
| Icon 1024×1024 không trong suốt, màn hình chờ | `ios/App/App/Assets.xcassets` (nguồn trong `assets/`) |
| Màn hình báo mất mạng thay vì trang trắng | `public/offline.html` (`server.errorPath`) |
| Chỉ hỗ trợ iPhone (không phải chụp ảnh iPad) | `TARGETED_DEVICE_FAMILY = 1` |

## Bạn cần chuẩn bị

1. **Tài khoản Apple Developer Program** (99 USD/năm): https://developer.apple.com/programs/enroll/. Đăng ký cá nhân thì tên bạn hiện là người bán.
2. **Máy Mac có Xcode** bản mới nhất. Không có Mac thì có thể thuê Mac trên mây (MacinCloud, …) hoặc dùng dịch vụ build như Codemagic, Ionic Appflow.
3. **Biến môi trường trên Vercel** (rồi redeploy):
   - `VITE_GOOGLE_IOS_CLIENT_ID`: xem `docs/MOBILE_APP.md`.
   - `VITE_SUPPORT_EMAIL`: email nhận hỗ trợ, hiện ở trang `/privacy` và `/help`. Apple yêu cầu có cách liên hệ.
4. **Backend**: nếu đổi Bundle ID thì đặt `APPLE_CLIENT_IDS` trên Render bằng Bundle ID mới.

## Các bước

### 1. Tạo App ID

developer.apple.com → Certificates, Identifiers & Profiles → Identifiers → **+** → App IDs → App:

- Bundle ID: `website.warteam.police` (phải giống Xcode; nếu đã bị người khác dùng thì đổi trong Xcode, `capacitor.config.ts` và `APPLE_CLIENT_IDS` ở backend).
- Bật **Sign In with Apple**.

### 2. Tạo app trên App Store Connect

appstoreconnect.apple.com → My Apps → **+** → New App: Platform iOS, tên `Police Smart Hub` (tên trên Store phải chưa ai dùng), ngôn ngữ chính Tiếng Việt, chọn Bundle ID ở trên, SKU tùy ý (ví dụ `police-smart-hub`).

### 3. Build và tải lên

```bash
npm ci
npm run build
npx cap sync ios
npx cap open ios
```

Trong Xcode:

1. Target **App** → Signing & Capabilities → Team: chọn tài khoản Developer. Kiểm tra có mục **Sign in with Apple** (lấy từ `App.entitlements`).
2. General → Version `1.0`, Build `1`. Mỗi lần tải lên phải tăng Build.
3. Thanh trên chọn **Any iOS Device (arm64)** → Product → **Archive**.
4. Cửa sổ Organizer → **Distribute App** → **App Store Connect** → Upload.

Sau khoảng 15–30 phút build hiện ở App Store Connect → TestFlight. Nên thử qua TestFlight trên iPhone thật trước khi gửi duyệt.

### 4. Điền thông tin trên App Store Connect

- **Ảnh chụp màn hình**: tối thiểu 3 ảnh iPhone 6.9" (1320×2868). Dễ nhất là chạy trên Simulator "iPhone 16 Pro Max" trong Xcode rồi bấm ⌘S. Nên chụp: bản đồ sự cố, form báo cáo, tin tức, màn hình cảnh sát.
- **Mô tả**, **từ khóa**, **Support URL**: `https://www.warteam.website/help`, **Privacy Policy URL**: `https://www.warteam.website/privacy`.
- Trong mô tả ghi rõ: "Đây là dự án độc lập, không phải ứng dụng chính thức của cơ quan Công an."
- **App Privacy**: khai báo thu thập Tên, Email, Số điện thoại, Vị trí chính xác, Ảnh, Nội dung người dùng; tất cả "Liên kết với người dùng", **không** dùng để theo dõi, mục đích "Chức năng ứng dụng".
- **Age Rating**: trả lời bảng câu hỏi (thường ra 4+ hoặc 12+ vì có báo cáo bạo lực/tội phạm do người dùng gửi).
- **App Review Information**: tạo sẵn 1 tài khoản email/mật khẩu vai trò người dân (và nên thêm 1 tài khoản cảnh sát) rồi điền vào mục Sign-in information. Ghi chú cho người duyệt bằng tiếng Anh, ví dụ:

  > This is an independent student project, not an official government or police app. Citizens report incidents with location and photos; police accounts see incidents on a live map. Demo accounts are provided above. Account deletion: Menu → "Xóa tài khoản".

### 5. Gửi duyệt

Chọn build trong mục Build → **Add for Review** → **Submit**. Apple thường phản hồi trong 1–3 ngày.

## Rủi ro bị từ chối và cách xử lý

- **4.2 Minimum Functionality** (app chỉ là trang web bọc lại): app đã có đăng nhập Google/Apple bản gốc, camera, vị trí, màn hình mất mạng, nhưng Apple vẫn có thể từ chối. Nếu bị, hướng tiếp theo là thêm thông báo đẩy (push notification) khi có sự cố mới gần người dùng hoặc khi báo cáo được xử lý.
- **5.1.1 / 1.1.6** (giống app chính thức của nhà nước): giữ tên trung tính và dòng ghi chú; trả lời người duyệt rằng đây là dự án học tập.
- **2.1** (người duyệt không đăng nhập được hoặc backend ngủ): nếu backend dùng gói miễn phí của Render, máy chủ ngủ sau 15 phút, lần đầu mở mất ~1 phút. Nên nâng gói hoặc mở app ngay trước khi gửi duyệt.
