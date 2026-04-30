import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

const configuredApiUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const defaultApiUrl = import.meta.env.DEV ? 'http://localhost:5055' : 'https://be-police-n8zf.onrender.com'
const API_BASE_URL = (configuredApiUrl || defaultApiUrl).replace(/\/$/, '')
const apiConfigProblem = !API_BASE_URL
  ? 'Ban production chua cau hinh VITE_API_BASE_URL tren Vercel.'
  : window.location.protocol === 'https:' && API_BASE_URL.startsWith('http://')
    ? 'Trang HTTPS khong the goi backend HTTP. Hay dung backend HTTPS cong khai.'
    : ''

type Role = 'Admin' | 'Police' | 'Support' | 'User' | 'Anonymous'

type User = {
  Username: string
  DisplayName: string
  Role: Role
  RedirectPath: string
}

type Incident = {
  Id: string
  Title: string
  Detail: string
  Category: string
  Level: string
  UrgencyScore: number
  ClassificationReason: string
  Latitude: number
  Longitude: number
  District: string
  TimeLabel: string
  Status: string
  Source: string
  ReporterName: string
  LastUpdatedBy: string
  InternalNote: string
  CreatedAt: string
  UpdatedAt: string
}

type Analysis = {
  Category: string
  Level: string
  UrgencyScore: number
  Reason: string
  ShouldCallEmergency: boolean
  Recommendation: string
}

type CreateIncidentResult = {
  Message: string
  Analysis: Analysis
  Incident: Incident
}

type Hotspot = {
  District: string
  OpenIncidentCount: number
  HighUrgencyCount: number
  AverageUrgencyScore: number
  RecommendedAction: string
}

type PatrolVehicle = {
  UnitCode: string
  District: string
  Status: string
  AssignedIncidentCount: number
  PriorityScore: number
  RecommendedFocus: string
}

type DispatchItem = {
  IncidentId: string
  Title: string
  Status: string
  Level: string
  UrgencyScore: number
  District: string
  ReporterName: string
  CreatedAt: string
  RecommendedAction: string
}

type MetricCount = {
  Key: string
  Count: number
}

type AdminStats = {
  TotalIncidents: number
  OpenIncidents: number
  ResolvedIncidents: number
  HighUrgencyIncidents: number
  ByStatus: MetricCount[]
  ByLevel: MetricCount[]
  ByDistrict: MetricCount[]
  AuditLogCount: number
}

type Health = {
  status: string
  databaseProvider: string
  signalRHub: string
  timestamp: string
}

type ApiError = Error & { status?: number }

type Filters = {
  search: string
  status: string
  level: string
  district: string
  sort: string
}

type ReportForm = {
  title: string
  location: string
  detail: string
  level: string
}

const statusOptions = ['Moi tiep nhan', 'Da tiep nhan', 'Dang xac minh', 'Da dieu phoi', 'Da xu ly']
const levelOptions = ['critical', 'high', 'medium', 'low']

const demoAccounts = [
  { username: 'admin', password: 'admin123', role: 'Admin' },
  { username: 'police', password: 'police123', role: 'Police' },
  { username: 'support', password: 'support123', role: 'Support' },
  { username: 'user', password: 'user123', role: 'User' },
]

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (apiConfigProblem) {
    throw new Error(apiConfigProblem)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    let message = `API loi ${response.status}`
    try {
      const payload = (await response.json()) as { message?: string; Message?: string }
      message = payload.message ?? payload.Message ?? message
    } catch {
      message = response.status === 401 ? 'Ban can dang nhap de thuc hien thao tac nay.' : message
    }
    const error: ApiError = new Error(message)
    error.status = response.status
    throw error
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function levelLabel(level: string) {
  const labels: Record<string, string> = {
    critical: 'Khan cap',
    high: 'Cao',
    medium: 'Trung binh',
    low: 'Thap',
  }
  return labels[level.toLowerCase()] ?? level
}

function canViewOperations(role?: Role) {
  return role === 'Admin' || role === 'Police' || role === 'Support'
}

function canUpdateIncident(role?: Role) {
  return role === 'Admin' || role === 'Police'
}

function canViewAdmin(role?: Role) {
  return role === 'Admin'
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [login, setLogin] = useState({ username: 'admin', password: 'admin123' })
  const [loginError, setLoginError] = useState('')
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [vehicles, setVehicles] = useState<PatrolVehicle[]>([])
  const [dispatchBoard, setDispatchBoard] = useState<DispatchItem[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [health, setHealth] = useState<Health | null>(null)
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: '',
    level: '',
    district: '',
    sort: 'newest',
  })
  const [reportForm, setReportForm] = useState<ReportForm>({
    title: 'Mat tai san tai cong vien',
    location: '10.7769, 106.7009',
    detail: 'Nguoi dan trinh bao bi giat tui xach, doi tuong di xe may roi khoi hien truong.',
    level: 'high',
  })
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [selectedIncidentId, setSelectedIncidentId] = useState('')
  const [statusUpdate, setStatusUpdate] = useState({ status: 'Dang xac minh', note: '' })

  const query = useMemo(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value.trim()) {
        params.set(key, value.trim())
      }
    })
    return params.toString()
  }, [filters])

  const loadPublicHealth = useCallback(async () => {
    try {
      setHealth(await api<Health>('/api/health'))
    } catch {
      setHealth(null)
    }
  }, [])

  const loadCurrentUser = useCallback(async () => {
    try {
      setUser(await api<User>('/api/auth/me'))
    } catch {
      setUser(null)
    }
  }, [])

  const loadIncidents = useCallback(async () => {
    if (!canViewOperations(user?.Role)) {
      setIncidents([])
      return
    }

    setIncidents(await api<Incident[]>(`/api/incidents${query ? `?${query}` : ''}`))
  }, [query, user?.Role])

  const loadRoleData = useCallback(async () => {
    if (!user) {
      return
    }

    const tasks: Promise<unknown>[] = [loadPublicHealth()]

    if (canViewOperations(user.Role)) {
      tasks.push(loadIncidents())
      tasks.push(api<Hotspot[]>('/api/police/hotspots').then(setHotspots))
    }

    if (canUpdateIncident(user.Role)) {
      tasks.push(api<PatrolVehicle[]>('/api/police/patrol-vehicles').then(setVehicles))
    } else {
      setVehicles([])
    }

    if (user.Role === 'Support' || user.Role === 'Admin' || user.Role === 'Police') {
      tasks.push(api<DispatchItem[]>('/api/support/dispatch-board').then(setDispatchBoard))
    } else {
      setDispatchBoard([])
    }

    if (canViewAdmin(user.Role)) {
      tasks.push(api<AdminStats>('/api/admin/statistics').then(setStats))
    } else {
      setStats(null)
    }

    await Promise.allSettled(tasks)
  }, [loadIncidents, loadPublicHealth, user])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPublicHealth()
      void loadCurrentUser()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadCurrentUser, loadPublicHealth])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRoleData()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadRoleData])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setLoginError('')
    try {
      const authenticated = await api<User>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ Username: login.username, Password: login.password }),
      })
      setUser(authenticated)
      setStatusMessage(`Dang nhap thanh cong: ${authenticated.DisplayName}`)
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Dang nhap that bai.')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await api('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setIncidents([])
    setStats(null)
    setStatusMessage('Da dang xuat.')
  }

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    try {
      const result = await api<Analysis>('/api/incidents/analyze', {
        method: 'POST',
        body: JSON.stringify({
          Title: reportForm.title,
          Detail: reportForm.detail,
          Level: reportForm.level,
        }),
      })
      setAnalysis(result)
      setStatusMessage('Da phan tich muc do uu tien.')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Khong the phan tich.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateIncident() {
    setLoading(true)
    try {
      const result = await api<CreateIncidentResult>('/api/incidents', {
        method: 'POST',
        body: JSON.stringify({
          Title: reportForm.title,
          Location: reportForm.location,
          Detail: reportForm.detail,
          Level: reportForm.level,
        }),
      })
      setAnalysis(result.Analysis)
      setStatusMessage(result.Message)
      await loadIncidents()
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Khong the tao bao cao.')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const incidentId = selectedIncidentId || incidents[0]?.Id || ''
    if (!incidentId) {
      return
    }

    setLoading(true)
    try {
      await api(`/api/incidents/${incidentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          Status: statusUpdate.status,
          InternalNote: statusUpdate.note,
        }),
      })
      setStatusMessage('Da cap nhat trang thai vu viec.')
      await loadRoleData()
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Khong the cap nhat trang thai.')
    } finally {
      setLoading(false)
    }
  }

  const effectiveIncidentId = selectedIncidentId || incidents[0]?.Id || ''
  const activeIncident = incidents.find((incident) => incident.Id === effectiveIncidentId)

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Police Smart Hub</p>
          <h1>Trung tam dieu hanh an ninh</h1>
        </div>
        <div className="topbar-actions">
          <span className={`health-pill ${health?.status === 'ok' ? 'is-ok' : ''}`}>
            API {health?.status === 'ok' ? 'online' : 'offline'}
          </span>
          {user ? (
            <button className="ghost-button" type="button" onClick={handleLogout}>
              Dang xuat
            </button>
          ) : null}
        </div>
      </header>

      <section className="identity-band">
        <div>
          <span className="section-kicker">Nguoi dung hien tai</span>
          <strong>{user ? user.DisplayName : 'Chua dang nhap'}</strong>
          <small>{user ? `${user.Username} - ${user.Role}` : `API: ${API_BASE_URL || 'chua cau hinh'}`}</small>
        </div>
        <div>
          <span className="section-kicker">Co so du lieu</span>
          <strong>{health?.databaseProvider ?? 'Dang kiem tra'}</strong>
          <small>{health?.signalRHub ?? '/hubs/incidents'}</small>
        </div>
        <div>
          <span className="section-kicker">Trang thai</span>
          <strong>{statusMessage || 'San sang nhan du lieu'}</strong>
          <small>{health?.timestamp ? formatDate(health.timestamp) : 'Chua dong bo'}</small>
        </div>
      </section>

      {apiConfigProblem ? (
        <section className="config-alert">
          <strong>Can cau hinh backend cho ban deploy</strong>
          <span>{apiConfigProblem}</span>
          <code>VITE_API_BASE_URL=https://ten-backend-cua-ban</code>
        </section>
      ) : null}

      {!user ? (
        <section className="login-layout">
          <form className="panel login-panel" onSubmit={handleLogin}>
            <div className="panel-heading">
              <span className="section-kicker">Dang nhap</span>
              <h2>Ket noi voi backend</h2>
            </div>
            <label>
              Tai khoan
              <input
                value={login.username}
                onChange={(event) => setLogin((current) => ({ ...current, username: event.target.value }))}
                placeholder="admin"
              />
            </label>
            <label>
              Mat khau
              <input
                type="password"
                value={login.password}
                onChange={(event) => setLogin((current) => ({ ...current, password: event.target.value }))}
                placeholder="admin123"
              />
            </label>
            {loginError ? <p className="error-text">{loginError}</p> : null}
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? 'Dang xu ly...' : 'Dang nhap'}
            </button>
          </form>

          <div className="panel">
            <div className="panel-heading">
              <span className="section-kicker">Tai khoan demo</span>
              <h2>Chon nhanh theo vai tro</h2>
            </div>
            <div className="account-grid">
              {demoAccounts.map((account) => (
                <button
                  key={account.username}
                  type="button"
                  onClick={() => setLogin({ username: account.username, password: account.password })}
                >
                  <strong>{account.role}</strong>
                  <span>{account.username} / {account.password}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="workspace">
          <section className="panel report-panel">
            <div className="panel-heading">
              <span className="section-kicker">Tiep nhan tin bao</span>
              <h2>Gui va phan tich vu viec</h2>
            </div>
            <form className="form-grid" onSubmit={handleAnalyze}>
              <label>
                Tieu de
                <input
                  value={reportForm.title}
                  onChange={(event) => setReportForm((current) => ({ ...current, title: event.target.value }))}
                />
              </label>
              <label>
                Toa do / vi tri
                <input
                  value={reportForm.location}
                  onChange={(event) => setReportForm((current) => ({ ...current, location: event.target.value }))}
                />
              </label>
              <label>
                Muc uu tien ban dau
                <select
                  value={reportForm.level}
                  onChange={(event) => setReportForm((current) => ({ ...current, level: event.target.value }))}
                >
                  {levelOptions.map((level) => (
                    <option key={level} value={level}>{levelLabel(level)}</option>
                  ))}
                </select>
              </label>
              <label className="wide-field">
                Noi dung
                <textarea
                  value={reportForm.detail}
                  onChange={(event) => setReportForm((current) => ({ ...current, detail: event.target.value }))}
                />
              </label>
              <div className="button-row">
                <button className="secondary-button" type="submit" disabled={loading}>
                  Phan tich
                </button>
                <button className="primary-button" type="button" onClick={handleCreateIncident} disabled={loading}>
                  Tao bao cao
                </button>
              </div>
            </form>
            {analysis ? (
              <div className="analysis-box">
                <strong>{analysis.Category} - {levelLabel(analysis.Level)}</strong>
                <span>Diem uu tien {analysis.UrgencyScore}/100</span>
                <p>{analysis.Recommendation}</p>
              </div>
            ) : null}
          </section>

          {canViewOperations(user.Role) ? (
            <section className="panel board-panel">
              <div className="panel-heading inline-heading">
                <div>
                  <span className="section-kicker">Bang vu viec</span>
                  <h2>{incidents.length} ho so dang hien thi</h2>
                </div>
                <button className="ghost-button" type="button" onClick={() => void loadRoleData()}>
                  Lam moi
                </button>
              </div>
              <div className="filter-grid">
                <input
                  value={filters.search}
                  onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                  placeholder="Tim kiem"
                />
                <select
                  value={filters.status}
                  onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                >
                  <option value="">Moi trang thai</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <select
                  value={filters.level}
                  onChange={(event) => setFilters((current) => ({ ...current, level: event.target.value }))}
                >
                  <option value="">Moi muc do</option>
                  {levelOptions.map((level) => (
                    <option key={level} value={level}>{levelLabel(level)}</option>
                  ))}
                </select>
                <input
                  value={filters.district}
                  onChange={(event) => setFilters((current) => ({ ...current, district: event.target.value }))}
                  placeholder="Quan / huyen"
                />
              </div>
              <div className="incident-list">
                {incidents.map((incident) => (
                  <button
                    className={incident.Id === effectiveIncidentId ? 'incident-row is-active' : 'incident-row'}
                    key={incident.Id}
                    type="button"
                    onClick={() => setSelectedIncidentId(incident.Id)}
                  >
                    <span className={`severity-dot level-${incident.Level.toLowerCase()}`} />
                    <span>
                      <strong>{incident.Title}</strong>
                      <small>{incident.District || 'Chua ro khu vuc'} - {formatDate(incident.CreatedAt)}</small>
                    </span>
                    <em>{incident.Status}</em>
                  </button>
                ))}
                {incidents.length === 0 ? <p className="muted-text">Khong co vu viec phu hop.</p> : null}
              </div>
            </section>
          ) : null}

          {activeIncident ? (
            <section className="panel detail-panel">
              <div className="panel-heading">
                <span className="section-kicker">Chi tiet ho so</span>
                <h2>{activeIncident.Title}</h2>
              </div>
              <dl className="detail-grid">
                <div><dt>Trang thai</dt><dd>{activeIncident.Status}</dd></div>
                <div><dt>Muc do</dt><dd>{levelLabel(activeIncident.Level)}</dd></div>
                <div><dt>Diem</dt><dd>{activeIncident.UrgencyScore}</dd></div>
                <div><dt>Nguon</dt><dd>{activeIncident.Source}</dd></div>
                <div><dt>Vi tri</dt><dd>{activeIncident.Latitude}, {activeIncident.Longitude}</dd></div>
                <div><dt>Nguoi bao</dt><dd>{activeIncident.ReporterName || 'Demo'}</dd></div>
              </dl>
              <p className="incident-detail">{activeIncident.Detail}</p>
              {canUpdateIncident(user.Role) ? (
                <form className="status-form" onSubmit={handleUpdateStatus}>
                  <select
                    value={statusUpdate.status}
                    onChange={(event) => setStatusUpdate((current) => ({ ...current, status: event.target.value }))}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <input
                    value={statusUpdate.note}
                    onChange={(event) => setStatusUpdate((current) => ({ ...current, note: event.target.value }))}
                    placeholder="Ghi chu noi bo"
                  />
                  <button className="primary-button" type="submit" disabled={loading}>
                    Cap nhat
                  </button>
                </form>
              ) : null}
            </section>
          ) : null}

          {canViewOperations(user.Role) ? (
            <section className="side-grid">
              <div className="panel">
                <div className="panel-heading">
                  <span className="section-kicker">Diem nong</span>
                  <h2>Khu vuc can chu y</h2>
                </div>
                <div className="compact-list">
                  {hotspots.map((hotspot) => (
                    <div key={hotspot.District}>
                      <strong>{hotspot.District}</strong>
                      <span>{hotspot.OpenIncidentCount} vu mo - {hotspot.HighUrgencyCount} uu tien cao</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel">
                <div className="panel-heading">
                  <span className="section-kicker">Dieu phoi</span>
                  <h2>Hang doi ho tro</h2>
                </div>
                <div className="compact-list">
                  {dispatchBoard.slice(0, 5).map((item) => (
                    <div key={item.IncidentId}>
                      <strong>{item.Title}</strong>
                      <span>{item.District} - {item.RecommendedAction}</span>
                    </div>
                  ))}
                </div>
              </div>

              {vehicles.length > 0 ? (
                <div className="panel">
                  <div className="panel-heading">
                    <span className="section-kicker">Tuan tra</span>
                    <h2>Don vi dang truc</h2>
                  </div>
                  <div className="compact-list">
                    {vehicles.map((vehicle) => (
                      <div key={vehicle.UnitCode}>
                        <strong>{vehicle.UnitCode} - {vehicle.District}</strong>
                        <span>{vehicle.Status} - {vehicle.RecommendedFocus}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {stats ? (
            <section className="panel admin-panel">
              <div className="panel-heading">
                <span className="section-kicker">Quan tri</span>
                <h2>Thong ke he thong</h2>
              </div>
              <div className="metric-grid">
                <div><strong>{stats.TotalIncidents}</strong><span>Tong vu viec</span></div>
                <div><strong>{stats.OpenIncidents}</strong><span>Dang mo</span></div>
                <div><strong>{stats.ResolvedIncidents}</strong><span>Da xu ly</span></div>
                <div><strong>{stats.AuditLogCount}</strong><span>Nhat ky</span></div>
              </div>
              <div className="status-bars">
                {stats.ByStatus.map((item) => (
                  <div key={item.Key}>
                    <span>{item.Key}</span>
                    <strong>{item.Count}</strong>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </section>
      )}
    </main>
  )
}

export default App
