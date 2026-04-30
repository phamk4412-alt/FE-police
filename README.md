# FE Police

Giao dien React + Vite ket noi voi backend `BE-police`.

## Chay local

Backend mac dinh duoc goi tai:

```text
http://localhost:5055
```

Chay frontend:

```powershell
npm ci
npm run dev
```

Neu backend chay cong khac, tao file `.env.local`:

```text
VITE_API_BASE_URL=http://localhost:5055
```

## Tai khoan demo

| Vai tro | Tai khoan | Mat khau |
| --- | --- | --- |
| Admin | `admin` | `admin123` |
| Police | `police` | `police123` |
| Support | `support` | `support123` |
| User | `user` | `user123` |

## API dang dung

- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/health`
- `POST /api/incidents/analyze`
- `POST /api/incidents`
- `GET /api/incidents`
- `PATCH /api/incidents/{id}/status`
- `GET /api/police/hotspots`
- `GET /api/police/patrol-vehicles`
- `GET /api/support/dispatch-board`
- `GET /api/admin/statistics`
