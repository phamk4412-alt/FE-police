# App iPhone / Android

App được làm bằng [Capacitor](https://capacitorjs.com). Thư mục `ios/` là project Xcode, `android/` là project Android Studio.

## Cách app hoạt động

- App mở trang đã deploy `https://www.warteam.website` bên trong khung app (đặt ở `capacitor.config.ts`). Mỗi lần deploy Vercel, app tự có bản mới, không cần build lại app.
- Backend vẫn thấy cùng origin với web, nên CORS, Didit và API không cần đổi gì.
- Google chặn đăng nhập web bên trong app, nên trong app nút Google dùng màn hình đăng nhập Google gốc của iOS/Android (`src/auth/nativeGoogle.ts`, plugin `@capgo/capacitor-social-login`). Token Google vẫn gửi vào `POST /api/auth/google` như web.
- Camera, micro và vị trí đã khai báo quyền trong `ios/App/App/Info.plist` và `android/app/src/main/AndroidManifest.xml`.
- Chỉ cần build lại app khi đổi code native, plugin, icon hoặc `capacitor.config.ts`.

## Cấu hình Google một lần

Làm trong cùng Google Cloud project đang có OAuth client Web (`VITE_GOOGLE_CLIENT_ID`).

### iPhone

1. Google Cloud Console → APIs & Services → Credentials → Create credentials → OAuth client ID → **iOS**, Bundle ID `website.warteam.police`.
2. Lấy Client ID dạng `1234-abcd.apps.googleusercontent.com`:
   - Trên Vercel thêm biến `VITE_GOOGLE_IOS_CLIENT_ID` = Client ID đó, rồi redeploy.
   - Trong `ios/App/App/Info.plist`, thay `com.googleusercontent.apps.REPLACE_WITH_IOS_CLIENT_ID` bằng "iOS URL scheme" Google hiển thị (là Client ID đảo ngược, ví dụ `com.googleusercontent.apps.1234-abcd`). Thiếu bước này app sẽ văng khi bấm đăng nhập Google.

### Android

1. Tạo OAuth client ID loại **Android**, package `website.warteam.police`, SHA-1 lấy từ `cd android && ./gradlew signingReport` (bản debug). Khi build bản release/Play Store thì thêm một client nữa với SHA-1 của khóa release.
2. Không cần thêm biến môi trường: Android dùng luôn Client ID Web.

Nếu OAuth consent screen đang ở chế độ Testing, thêm tài khoản Google dùng để thử vào Test users.

## Chạy trên iPhone

Cần máy Mac có Xcode (bản mới) và iPhone cắm cáp.

```bash
npm ci
npm run build
npm run ios          # sync rồi mở Xcode
```

Trong Xcode:

1. Chọn target **App** → Signing & Capabilities → Team: đăng nhập Apple ID của bạn (Apple ID miễn phí cũng được, app chạy 7 ngày rồi phải cài lại).
2. Nếu báo trùng Bundle ID, đổi thành ID riêng (ví dụ `website.warteam.police.ten-ban`) và tạo lại client iOS ở Google với ID mới.
3. Chọn iPhone của bạn ở thanh trên cùng → bấm ▶ Run.
4. Lần đầu, trên iPhone vào Cài đặt → Cài đặt chung → Quản lý VPN & Thiết bị → tin cậy nhà phát triển. iOS 16+ cần bật Cài đặt → Quyền riêng tư & Bảo mật → Chế độ nhà phát triển.

### Gửi cho người khác bằng TestFlight

Cần tài khoản Apple Developer (99 USD/năm).

1. Xcode → chọn "Any iOS Device (arm64)" → Product → Archive.
2. Organizer → Distribute App → App Store Connect → Upload.
3. Trên App Store Connect, vào app → TestFlight → thêm người thử bằng email.

Lưu ý: nếu đưa lên App Store công khai, Apple có thể từ chối app chỉ bọc trang web (guideline 4.2). TestFlight và cài trực tiếp thì không bị ảnh hưởng.

## Chạy trên Android

Cần Android Studio (Windows, Mac hoặc Linux).

```bash
npm ci
npm run build
npm run android      # sync rồi mở Android Studio
```

Cắm điện thoại (bật USB debugging) hoặc dùng máy ảo, rồi bấm ▶ Run. File APK để gửi người khác: Build → Build App Bundle(s) / APK(s) → Build APK(s).

## Thử với web đang chạy ở máy

```bash
npm run dev -- --host
CAP_SERVER_URL=http://<IP-máy-bạn>:5173 npx cap sync
```

Rồi Run lại từ Xcode/Android Studio. Nhớ chạy `npx cap sync` không có `CAP_SERVER_URL` trước khi build bản thật.

## Giới hạn hiện tại

- App cần mạng (vì mở trang live).
- Cảnh sát chỉ gửi vị trí khi app đang mở; khi tắt màn hình hoặc chuyển app, iOS/Android dừng gửi.
- Icon và màn hình chờ đang là mặc định của Capacitor. Muốn đổi: đặt ảnh 1024×1024 vào `assets/icon.png` rồi chạy `npx @capacitor/assets generate`.
