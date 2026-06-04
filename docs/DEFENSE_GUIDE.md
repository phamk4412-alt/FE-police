# Huong Dan Bao Ve Do An Police Smart Hub

## 1. Tong Quan He Thong

Do an gom 2 phan:

- Frontend `FE-police`: React, TypeScript, Vite. Phu trach giao dien, routing, goi API, hien thi ban do va dashboard theo vai tro.
- Backend `BE-police`: ASP.NET Core, Entity Framework Core, SignalR. Phu trach API, auth demo, xu ly vu viec, thong ke, realtime va cac endpoint cho dashboard.

Mo hinh trien khai:

```text
User/Admin/Police/Support
        |
        v
React Frontend
        |
        v
ASP.NET Core API
        |
        v
Service + DbContext / In-memory demo data
```

## 2. Phan Tang Code

Frontend:

- `src/pages`: cac man hinh lon nhu login, admin, police, support, user.
- `src/components`: layout, button, map, bang admin.
- `src/services`: lop goi API backend.
- `src/routes`: dieu huong va bao ve route.
- `src/types`: kieu du lieu dung chung.
- `src/utils`: helper ve role, identity, constant.

Backend:

- `controllers`: nhan request va tra response.
- `modules`: map route API theo tung vai tro.
- `services`: xu ly nghiep vu, vi du `IncidentService`, `AuthService`.
- `models`: record/entity request/response.
- `database`: `IncidentDbContext`, cau hinh bang `Incidents`, `AuditLogs`.
- `config`: cau hinh auth, CORS, database, policy.

Backend khong dat ten folder la `Repositories`, nhung hien co tang Server + Service + DbContext. Khi giai thich voi thay, co the noi `DbContext` dong vai tro truy cap du lieu, `Service` dong vai tro business logic.

## 3. Luong Dang Nhap Va Phan Quyen

Frontend dung Clerk cho dang nhap UI:

- `src/ClerkProviderWithRouter.tsx`
- `src/pages/auth/Login.tsx`
- `src/components/common/ProtectedRoute.tsx`

Sau khi dang nhap, `ProtectedRoute` doc role tu Clerk metadata va chi cho vao route hop le:

- Admin: `/admin`
- Police: `/police`
- Support: `/support`
- User: `/user`

Backend co auth demo bang cookie:

- `BE-police/controllers/AuthController.cs`
- `BE-police/services/AuthService.cs`

Mot so frontend service tu dong tao backend session demo khi API tra 401/403:

- `src/services/backendAuthService.ts`
- `src/services/adminUserService.ts`
- `src/services/newsService.ts`
- `src/services/supportIncidentService.ts`

## 4. CRUD Chinh

### Quan Ly Vu Viec

Create:

- FE: `src/pages/dashboards/UserDashboard.tsx`
- FE service: `src/services/userService.ts`
- BE route: `POST /api/incidents`
- BE controller: `UserController.CreateIncidentAsync`
- BE service: `IncidentService.TryBuildIncident`

Read:

- FE: `MapView`, `PoliceDashboard`, `SupportDashboard`, `UserDashboard`
- BE route: `GET /api/incidents`, `GET /api/incidents/{id}`
- BE controller: `PoliceController.GetIncidentBoardAsync`, `UserController.GetIncidentByIdAsync`

Update:

- FE: `src/services/supportIncidentService.ts`
- BE route: `PATCH /api/incidents/{id}/status`
- BE controller: `PoliceController.UpdateIncidentStatusAsync`
- BE service: `IncidentService.UpdateIncidentStatusAsync`

Delete:

- FE: `src/services/supportIncidentService.ts`
- BE route: `DELETE /api/support/incidents/{id}`
- BE controller: `SupportController.DeleteIncidentAsync`
- BE service: `IncidentService.DeleteIncidentAsync`

### Quan Ly Tin Tuc

- Public read: `GET /api/news`, `GET /api/news/featured`, `GET /api/news/{id}`
- Support CRUD: `GET/POST/PUT/DELETE /api/support/news`
- Update status: `PATCH /api/support/news/{id}/status`
- Update featured: `PATCH /api/support/news/{id}/featured`

Code lien quan:

- FE: `src/pages/news/SupportNewsManager.tsx`
- FE service: `src/services/newsService.ts`
- BE: `BE-police/controllers/NewsController.cs`

### Quan Ly Tai Khoan Admin

- FE: `src/pages/dashboards/AdminDashboard.tsx`
- FE service: `src/services/adminUserService.ts`
- BE routes:
  - `GET /api/admin/clerk/accounts`
  - `PATCH /api/admin/clerk/accounts/{id}/role`
  - `PATCH /api/admin/clerk/accounts/{id}/status`
  - `DELETE /api/admin/clerk/accounts/{id}`
- BE: `AdminController`, `AuthService`

## 5. Ban Do Va Vi Tri Canh Sat

Frontend map dung Mapbox:

- `src/components/map/MapView.tsx`

Backend route:

- `GET /api/police/locations`
- `POST /api/police/me/location`
- `DELETE /api/police/me/location`
- `POST /api/police/me/location/end`

Khi canh sat vao dashboard, FE lay vi tri trinh duyet va gui len backend. Khi dang xuat hoac roi trang, FE goi endpoint end de xoa vi tri truc.

## 6. Xac Minh Danh Tinh

Frontend:

- `src/pages/auth/FaceScan.tsx`
- `src/utils/identityVerification.ts`

Backend demo endpoints:

- `GET /api/identity/state`
- `POST /api/identity/cccd`
- `POST /api/identity/face`
- `POST /api/identity/reset`
- `POST /api/identity/didit/session`
- `POST /api/identity/didit/session/{sessionId}/complete`

Trong demo, Didit duoc mo phong approve de flow khong bi loi 404.

## 7. Cac Loi Da Sua

- Doi update incident tu `PUT` sang `PATCH` de khop backend.
- Them unwrap response `Incident` tu ket qua update status.
- Them backend route xoa incident.
- Them backend news CRUD.
- Them backend identity/Didit demo endpoints.
- Them backend police location endpoints.
- Them backend admin account aliases.
- Cho Mapbox doc duoc ca `VITE_MAPBOX_TOKEN` va `VITE_MAPBOX_ACCESS_TOKEN`.
- Sua lint error trong `api.ts` bang cach gan `cause` cho error timeout.
- Bo secret Clerk va password SQL khoi cau hinh local dang nho.

## 8. Lenh Kiem Tra

Frontend:

```powershell
npm.cmd run lint
npm.cmd run build
```

Backend:

```powershell
dotnet build C:\Users\Hp\BE-police\BackEnd-Police.sln
```

Ket qua gan nhat: ca lint FE, build FE va build BE deu thanh cong.

## 9. Cach Demo De An

1. Chay backend o cong `5055`.
2. Chay frontend bang `npm run dev`.
3. Dang nhap Clerk tren FE.
4. Chon role va vao dashboard tuong ung.
5. Demo user tao bao cao su co.
6. Demo support xem danh sach, cap nhat trang thai, xoa vu viec, quan ly tin tuc.
7. Demo police xem ban do, danh sach su co va vi tri truc.
8. Demo admin xem thong ke, bang tai khoan, doi role/status, xoa tai khoan demo.

## 10. Cach Tra Loi Khi Thay Hoi

Neu thay hoi "MVC/phan tang nam o dau?":

> Frontend tach page, component, service, route, type. Backend tach controller, module route, service nghiep vu, model va DbContext. Controller nhan request, service xu ly nghiep vu, DbContext truy cap du lieu.

Neu thay hoi "CRUD nam o dau?":

> CRUD ro nhat la module incident va news. Incident co create/read/update/delete qua API. News co CRUD day du cho support. Admin account co read/update/delete demo.

Neu thay hoi "AI viet thi em hieu gi?":

> Em hieu luong du lieu tu UI sang service, service goi API, backend controller nhan request, service xu ly, luu vao DbContext hoac bo nho demo, roi tra response ve UI. Em co the chi tung file theo tung chuc nang.
