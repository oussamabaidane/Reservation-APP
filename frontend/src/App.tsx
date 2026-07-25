import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import floorPlan from './assets/floor-plan.svg'
import './App.css'

type Role = 'EMPLOYE' | 'ADMINISTRATEUR'
type RoomType = 'CONFERENCE' | 'BUREAU' | 'FORMATION'
type ReservationStatus = 'EN_ATTENTE' | 'CONFIRMEE' | 'ANNULEE' | 'TERMINEE'

type UserSession = {
  id: number
  fullName: string
  email: string
  role: Role
}

type LoginResponse = {
  accessToken: string
  refreshToken: string
  role: Role
  employeeId?: number | null
  fullName?: string | null
  email?: string | null
}

type Room = {
  id?: number
  numero: string
  nom: string
  capaciteMaximale: number
  type: RoomType
  active: boolean
  localisation?: string
}

type Employee = {
  id?: number
  numeroEmploye: string
  nom: string
  prenom: string
  email: string
  passwordHash?: string
  departement?: string
  role: Role
  actif: boolean
}

type Reservation = {
  id?: number
  employeeId: number
  roomId: number
  dateReservation: string
  heureDebut: string
  heureFin: string
  dureeMinutes?: number
  motif?: string
  statut: ReservationStatus
}

type NotificationItem = {
  id?: number
  destinataireId: number
  message: string
  dateEnvoi?: string
  lue: boolean
}

type AuditLog = {
  id?: number
  utilisateurId: number
  action: string
  dateAction?: string
  adresseIp?: string
}

type ServiceStatistics = {
  notifications?: number
  unreadNotifications?: number
  auditLogs?: number
}

type ReservationForm = {
  employeeId: string
  roomId: string
  dateReservation: string
  heureDebut: string
  heureFin: string
  motif: string
}

type SearchForm = {
  date: string
  start: string
  end: string
  minCapacity: string
  type: RoomType | ''
  location: string
}

type RoomForm = {
  id?: number
  numero: string
  nom: string
  capaciteMaximale: string
  type: RoomType
  localisation: string
  active: boolean
}

type EmployeeForm = {
  id?: number
  numeroEmploye: string
  nom: string
  prenom: string
  email: string
  password: string
  departement: string
  role: Role
  actif: boolean
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

const today = new Date().toISOString().slice(0, 10)
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

const roomTypes: RoomType[] = ['CONFERENCE', 'BUREAU', 'FORMATION']

const demoRooms: Room[] = [
  { id: 1, numero: 'S-101', nom: 'Atlas', capaciteMaximale: 8, type: 'CONFERENCE', active: true, localisation: 'Etage 1' },
  { id: 2, numero: 'S-204', nom: 'Rif', capaciteMaximale: 14, type: 'FORMATION', active: true, localisation: 'Etage 2' },
  { id: 3, numero: 'S-310', nom: 'Souss', capaciteMaximale: 6, type: 'BUREAU', active: true, localisation: 'Etage 3' },
  { id: 4, numero: 'S-412', nom: 'Draa', capaciteMaximale: 20, type: 'CONFERENCE', active: false, localisation: 'Etage 4' },
]

const demoEmployees: Employee[] = [
  {
    id: 1,
    numeroEmploye: 'E-001',
    nom: 'Systeme',
    prenom: 'Admin',
    email: 'admin@reservation.app',
    departement: 'Direction',
    role: 'ADMINISTRATEUR',
    actif: true,
  },
  {
    id: 2,
    numeroEmploye: 'E-101',
    nom: 'Benali',
    prenom: 'Sara',
    email: 'employee@reservation.app',
    departement: 'Produit',
    role: 'EMPLOYE',
    actif: true,
  },
  {
    id: 3,
    numeroEmploye: 'E-102',
    nom: 'Alaoui',
    prenom: 'Yassine',
    email: 'yassine@reservation.app',
    departement: 'RH',
    role: 'EMPLOYE',
    actif: true,
  },
]

const demoReservations: Reservation[] = [
  {
    id: 1,
    employeeId: 2,
    roomId: 1,
    dateReservation: tomorrow,
    heureDebut: '09:00:00',
    heureFin: '10:00:00',
    dureeMinutes: 60,
    motif: 'Point equipe',
    statut: 'CONFIRMEE',
  },
]

const demoNotifications: NotificationItem[] = [
  {
    id: 1,
    destinataireId: 1,
    message: 'Systeme de reservation pret',
    dateEnvoi: `${today}T08:30:00`,
    lue: false,
  },
]

const initialReservationForm: ReservationForm = {
  employeeId: '2',
  roomId: '1',
  dateReservation: tomorrow,
  heureDebut: '10:00',
  heureFin: '11:00',
  motif: 'Reunion projet',
}

const initialSearchForm: SearchForm = {
  date: tomorrow,
  start: '10:00',
  end: '11:00',
  minCapacity: '',
  type: '',
  location: '',
}

const initialRoomForm: RoomForm = {
  numero: '',
  nom: '',
  capaciteMaximale: '8',
  type: 'CONFERENCE',
  localisation: '',
  active: true,
}

const initialEmployeeForm: EmployeeForm = {
  numeroEmploye: '',
  nom: '',
  prenom: '',
  email: '',
  password: 'employee123',
  departement: '',
  role: 'EMPLOYE',
  actif: true,
}

const services = [
  { name: 'Gateway', port: '8080', path: '/actuator/health' },
  { name: 'Identity', port: '8081', path: '/employees' },
  { name: 'Rooms', port: '8082', path: '/rooms' },
  { name: 'Reservation', port: '8083', path: '/reservations' },
  { name: 'Audit', port: '8084', path: '/audit/logs' },
]

function statusLabel(status: ReservationStatus) {
  const labels: Record<ReservationStatus, string> = {
    EN_ATTENTE: 'En attente',
    CONFIRMEE: 'Confirmee',
    ANNULEE: 'Annulee',
    TERMINEE: 'Terminee',
  }

  return labels[status]
}

function roomTypeLabel(type: RoomType) {
  const labels: Record<RoomType, string> = {
    CONFERENCE: 'Conference',
    BUREAU: 'Bureau',
    FORMATION: 'Formation',
  }

  return labels[type]
}

function toApiTime(value: string) {
  return value.length === 5 ? `${value}:00` : value
}

function shortTime(value: string) {
  return value.slice(0, 5)
}

function employeeName(employee?: Employee) {
  if (!employee) {
    return 'Employe inconnu'
  }

  return `${employee.prenom} ${employee.nom}`
}

function roomName(room?: Room) {
  if (!room) {
    return 'Salle inconnue'
  }

  return `${room.numero} - ${room.nom}`
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `HTTP ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

function fallbackSession(email: string, password: string): UserSession | null {
  if (email === 'admin@reservation.app' && password === 'admin123') {
    return { id: 1, fullName: 'Admin Systeme', email, role: 'ADMINISTRATEUR' }
  }

  if (email === 'employee@reservation.app' && password === 'employee123') {
    return { id: 2, fullName: 'Sara Benali', email, role: 'EMPLOYE' }
  }

  return null
}

function App() {
  const [session, setSession] = useState<UserSession | null>(null)
  const [loginEmail, setLoginEmail] = useState('employee@reservation.app')
  const [loginPassword, setLoginPassword] = useState('employee123')
  const [rooms, setRooms] = useState<Room[]>(demoRooms)
  const [employees, setEmployees] = useState<Employee[]>(demoEmployees)
  const [reservations, setReservations] = useState<Reservation[]>(demoReservations)
  const [notifications, setNotifications] = useState<NotificationItem[]>(demoNotifications)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [serviceStats, setServiceStats] = useState<ServiceStatistics>({})
  const [reservationForm, setReservationForm] = useState<ReservationForm>(initialReservationForm)
  const [searchForm, setSearchForm] = useState<SearchForm>(initialSearchForm)
  const [roomForm, setRoomForm] = useState<RoomForm>(initialRoomForm)
  const [employeeForm, setEmployeeForm] = useState<EmployeeForm>(initialEmployeeForm)
  const [availabilityByRoom, setAvailabilityByRoom] = useState<Record<number, boolean | null>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [apiOnline, setApiOnline] = useState<boolean | null>(null)
  const [message, setMessage] = useState('Pret')

  const roomsById = useMemo(() => new Map(rooms.map((room) => [room.id, room])), [rooms])
  const employeesById = useMemo(() => new Map(employees.map((employee) => [employee.id, employee])), [employees])
  const isAdmin = session?.role === 'ADMINISTRATEUR'

  const displayedReservations = useMemo(() => {
    if (!session) {
      return reservations
    }

    return isAdmin ? reservations : reservations.filter((reservation) => reservation.employeeId === session.id)
  }, [isAdmin, reservations, session])

  const activeRooms = rooms.filter((room) => room.active)
  const visibleNotifications = useMemo(() => {
    if (!session) {
      return notifications
    }

    return isAdmin ? notifications : notifications.filter((notification) => notification.destinataireId === session.id)
  }, [isAdmin, notifications, session])

  const totals = useMemo(() => {
    const activeReservations = reservations.filter((reservation) => reservation.statut !== 'ANNULEE')
    const cancelledReservations = reservations.filter((reservation) => reservation.statut === 'ANNULEE')
    const bookedHours = activeReservations.reduce((sum, reservation) => sum + (reservation.dureeMinutes ?? 0), 0) / 60

    return {
      activeReservations: activeReservations.length,
      cancelledReservations: cancelledReservations.length,
      bookedHours: Math.round(bookedHours * 10) / 10,
      activeRooms: activeRooms.length,
      employees: employees.filter((employee) => employee.actif).length,
      unread: visibleNotifications.filter((notification) => !notification.lue).length,
    }
  }, [activeRooms.length, employees, reservations, visibleNotifications])

  const loadData = useCallback(async () => {
    setLoading(true)

    const [roomResult, employeeResult, reservationResult, notificationResult, auditResult, statsResult] = await Promise.allSettled([
      api<Room[]>('/rooms'),
      api<Employee[]>('/employees'),
      api<Reservation[]>('/reservations'),
      session
        ? api<NotificationItem[]>(isAdmin ? '/notifications' : `/notifications/user/${session.id}`)
        : api<NotificationItem[]>('/notifications'),
      api<AuditLog[]>('/audit/logs'),
      api<ServiceStatistics>('/statistics'),
    ])

    const online = [roomResult, employeeResult, reservationResult].some((result) => result.status === 'fulfilled')

    if (roomResult.status === 'fulfilled') {
      setRooms(roomResult.value)
    }
    if (employeeResult.status === 'fulfilled') {
      setEmployees(employeeResult.value)
    }
    if (reservationResult.status === 'fulfilled') {
      setReservations(reservationResult.value)
    }
    if (notificationResult.status === 'fulfilled') {
      setNotifications(notificationResult.value)
    }
    if (auditResult.status === 'fulfilled') {
      setAuditLogs(auditResult.value)
    }
    if (statsResult.status === 'fulfilled') {
      setServiceStats(statsResult.value)
    }

    setApiOnline(online)
    setMessage(online ? 'Donnees synchronisees' : 'Mode demo local')
    setLoading(false)
  }, [isAdmin, session])

  useEffect(() => {
    void loadData()
  }, [loadData])

  async function loginWith(email: string, password: string) {
    setSaving(true)
    setMessage('Connexion...')

    try {
      const response = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      const employeeId = response.employeeId ?? fallbackSession(email, password)?.id ?? 1
      setSession({
        id: employeeId,
        fullName: response.fullName ?? email,
        email: response.email ?? email,
        role: response.role,
      })
      setReservationForm((current) => ({ ...current, employeeId: String(employeeId) }))
      setApiOnline(true)
      setMessage('Utilisateur connecte')
    } catch (error) {
      const fallback = fallbackSession(email, password)
      if (!fallback) {
        setMessage(error instanceof Error ? error.message : 'Connexion refusee')
      } else {
        setSession(fallback)
        setReservationForm((current) => ({ ...current, employeeId: String(fallback.id) }))
        setApiOnline(false)
        setMessage('Mode demo local')
      }
    } finally {
      setSaving(false)
    }
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await loginWith(loginEmail, loginPassword)
  }

  async function quickLogin(role: Role) {
    const email = role === 'ADMINISTRATEUR' ? 'admin@reservation.app' : 'employee@reservation.app'
    const password = role === 'ADMINISTRATEUR' ? 'admin123' : 'employee123'
    setLoginEmail(email)
    setLoginPassword(password)
    await loginWith(email, password)
  }

  async function searchAvailableRooms(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    setLoading(true)
    setMessage('Recherche des salles...')

    try {
      const params = new URLSearchParams()
      if (searchForm.minCapacity) {
        params.set('minCapacity', searchForm.minCapacity)
      }
      if (searchForm.type) {
        params.set('type', searchForm.type)
      }
      if (searchForm.location.trim()) {
        params.set('location', searchForm.location.trim())
      }

      const foundRooms = await api<Room[]>(`/rooms/search${params.size > 0 ? `?${params}` : ''}`)
      setRooms(foundRooms)

      const availabilityEntries = await Promise.all(
        foundRooms
          .filter((room) => room.id)
          .map(async (room) => {
            try {
              const params = new URLSearchParams({
                roomId: String(room.id),
                date: searchForm.date,
                start: toApiTime(searchForm.start),
                end: toApiTime(searchForm.end),
              })
              const result = await api<{ available: boolean }>(`/reservations/check-availability?${params}`)
              return [room.id as number, result.available] as const
            } catch {
              return [room.id as number, null] as const
            }
          }),
      )

      setAvailabilityByRoom(Object.fromEntries(availabilityEntries))
      setApiOnline(true)
      setMessage('Salles disponibles verifiees')
    } catch (error) {
      setApiOnline(false)
      setMessage(error instanceof Error ? error.message : 'Recherche impossible')
    } finally {
      setLoading(false)
    }
  }

  async function createReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) {
      setMessage('Connexion requise')
      return
    }

    setSaving(true)
    setMessage('Verification disponibilite...')

    const employeeId = isAdmin ? Number(reservationForm.employeeId) : session.id
    const payload = {
      employeeId,
      roomId: Number(reservationForm.roomId),
      dateReservation: reservationForm.dateReservation,
      heureDebut: toApiTime(reservationForm.heureDebut),
      heureFin: toApiTime(reservationForm.heureFin),
      motif: reservationForm.motif,
      statut: 'CONFIRMEE',
    }

    try {
      const params = new URLSearchParams({
        roomId: String(payload.roomId),
        date: payload.dateReservation,
        start: payload.heureDebut,
        end: payload.heureFin,
      })
      const availability = await api<{ available: boolean; message: string }>(`/reservations/check-availability?${params}`)
      if (!availability.available) {
        throw new Error('Conflit horaire detecte')
      }

      await api<Reservation>('/reservations', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setReservationForm((current) => ({
        ...initialReservationForm,
        employeeId: String(employeeId),
        roomId: current.roomId,
        dateReservation: current.dateReservation,
      }))
      await loadData()
      setMessage('Reservation enregistree')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Reservation impossible')
    } finally {
      setSaving(false)
    }
  }

  async function cancelReservation(id?: number) {
    if (!id) {
      return
    }

    setSaving(true)
    setMessage('Annulation...')

    try {
      await api<Reservation>(`/reservations/${id}/cancel`, { method: 'PUT' })
      await loadData()
      setMessage('Reservation annulee')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Annulation impossible')
    } finally {
      setSaving(false)
    }
  }

  async function saveRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !isAdmin) {
      return
    }

    setSaving(true)
    const payload: Room = {
      numero: roomForm.numero.trim(),
      nom: roomForm.nom.trim(),
      capaciteMaximale: Number(roomForm.capaciteMaximale),
      type: roomForm.type,
      localisation: roomForm.localisation.trim(),
      active: roomForm.active,
    }

    try {
      if (roomForm.id) {
        await api<Room>(`/rooms/${roomForm.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        await writeAudit(session.id, `UPDATE_ROOM numero=${payload.numero}`)
      } else {
        await api<Room>('/rooms', { method: 'POST', body: JSON.stringify(payload) })
        await writeAudit(session.id, `CREATE_ROOM numero=${payload.numero}`)
      }
      setRoomForm(initialRoomForm)
      await loadData()
      setMessage('Salle enregistree')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Salle non enregistree')
    } finally {
      setSaving(false)
    }
  }

  async function disableRoom(room: Room) {
    if (!session || !isAdmin || !room.id) {
      return
    }

    try {
      await api<Room>(`/rooms/${room.id}/disable`, { method: 'PUT' })
      await writeAudit(session.id, `DISABLE_ROOM numero=${room.numero}`)
      await loadData()
      setMessage('Salle desactivee')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Desactivation impossible')
    }
  }

  async function saveEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !isAdmin) {
      return
    }

    setSaving(true)
    const payload: Employee = {
      numeroEmploye: employeeForm.numeroEmploye.trim(),
      nom: employeeForm.nom.trim(),
      prenom: employeeForm.prenom.trim(),
      email: employeeForm.email.trim(),
      passwordHash: employeeForm.password,
      departement: employeeForm.departement.trim(),
      role: employeeForm.role,
      actif: employeeForm.actif,
    }

    try {
      if (employeeForm.id) {
        await api<Employee>(`/employees/${employeeForm.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        await writeAudit(session.id, `UPDATE_EMPLOYEE email=${payload.email}`)
      } else {
        await api<Employee>('/employees', { method: 'POST', body: JSON.stringify(payload) })
        await writeAudit(session.id, `CREATE_EMPLOYEE email=${payload.email}`)
      }
      setEmployeeForm(initialEmployeeForm)
      await loadData()
      setMessage('Employe enregistre')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Employe non enregistre')
    } finally {
      setSaving(false)
    }
  }

  async function disableEmployee(employee: Employee) {
    if (!session || !isAdmin || !employee.id) {
      return
    }

    try {
      await api<Employee>(`/employees/${employee.id}/disable`, { method: 'PUT' })
      await writeAudit(session.id, `DISABLE_EMPLOYEE email=${employee.email}`)
      await loadData()
      setMessage('Employe desactive')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Desactivation impossible')
    }
  }

  async function markNotificationRead(notification: NotificationItem) {
    if (!notification.id) {
      return
    }

    try {
      await api<NotificationItem>(`/notifications/${notification.id}/read`, { method: 'PUT' })
      await loadData()
    } catch {
      setMessage('Notification non mise a jour')
    }
  }

  async function writeAudit(utilisateurId: number, action: string) {
    try {
      await api<AuditLog>('/audit/logs', {
        method: 'POST',
        body: JSON.stringify({ utilisateurId, action, adresseIp: 'frontend' }),
      })
    } catch {
      setMessage('Audit indisponible')
    }
  }

  function selectRoom(room: Room) {
    if (!room.id) {
      return
    }

    setReservationForm((current) => ({ ...current, roomId: String(room.id) }))
    setMessage(`${room.numero} selectionnee`)
  }

  function editRoom(room: Room) {
    setRoomForm({
      id: room.id,
      numero: room.numero,
      nom: room.nom,
      capaciteMaximale: String(room.capaciteMaximale),
      type: room.type,
      localisation: room.localisation ?? '',
      active: room.active,
    })
  }

  function editEmployee(employee: Employee) {
    setEmployeeForm({
      id: employee.id,
      numeroEmploye: employee.numeroEmploye,
      nom: employee.nom,
      prenom: employee.prenom,
      email: employee.email,
      password: '',
      departement: employee.departement ?? '',
      role: employee.role,
      actif: employee.actif,
    })
  }

  function logout() {
    setSession(null)
    setMessage('Pret')
  }

  if (!session) {
    return (
      <main className="login-page">
        <section className="login-shell">
          <div className="login-visual">
            <div className="brand login-brand">
              <span>RS</span>
              <strong>Reservation APP</strong>
            </div>
            <p className="eyebrow">Systeme de reservation de salles</p>
            <h1>Connexion</h1>
            <p className="login-copy">Acces separe pour les employes et les administrateurs.</p>
            <div className="login-demo-grid">
              <button className="secondary-button" type="button" onClick={() => void quickLogin('EMPLOYE')}>
                Employe demo
              </button>
              <button className="secondary-button" type="button" onClick={() => void quickLogin('ADMINISTRATEUR')}>
                Admin demo
              </button>
            </div>
            <div className="service-state login-state">
              <span className={apiOnline ? 'dot online-dot' : 'dot offline-dot'} />
              {apiOnline ? 'Services connectes' : 'Mode demo'}
            </div>
          </div>

          <form className="login-card" onSubmit={submitLogin}>
            <div>
              <p className="eyebrow">Authentification</p>
              <h2>Se connecter</h2>
            </div>
            <label>
              Email
              <input value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} />
            </label>
            <label>
              Mot de passe
              <input type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} />
            </label>
            <button type="submit" disabled={saving}>
              {saving ? 'Connexion...' : 'Connexion'}
            </button>
            <p className="form-message">{message}</p>
          </form>
        </section>
      </main>
    )
  }

  const visibleActiveReservations = displayedReservations.filter((reservation) => reservation.statut !== 'ANNULEE')
  const visibleBookedHours = Math.round(
    (visibleActiveReservations.reduce((sum, reservation) => sum + (reservation.dureeMinutes ?? 0), 0) / 60) * 10,
  ) / 10

  return (
    <main className={`app-shell ${isAdmin ? 'admin-shell' : 'employee-shell'}`}>
      <aside className="sidebar" aria-label="Navigation">
        <div className="brand">
          <span>RS</span>
          <strong>Reservation APP</strong>
        </div>
        <nav>
          <a href="#dashboard">Dashboard</a>
          {!isAdmin && <a href="#rooms">Recherche</a>}
          <a href="#reservations">{isAdmin ? 'Reservations' : 'Mes reservations'}</a>
          {isAdmin && <a href="#admin">Administration</a>}
          <a href={isAdmin ? '#audit' : '#notifications'}>{isAdmin ? 'Audit' : 'Notifications'}</a>
        </nav>
        <div className="service-state">
          <span className={apiOnline ? 'dot online-dot' : 'dot offline-dot'} />
          {apiOnline ? 'Services connectes' : 'Mode demo'}
        </div>
      </aside>

      <section className="workspace" id="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">{isAdmin ? 'Interface administrateur' : 'Interface employe'}</p>
            <h1>{isAdmin ? 'Administration du systeme' : 'Espace employe'}</h1>
            <span className={`role-chip ${isAdmin ? 'admin-chip' : ''}`}>{session.fullName}</span>
          </div>
          <div className="topbar-actions">
            <button className="secondary-button" type="button" onClick={() => void loadData()} disabled={loading}>
              {loading ? 'Chargement...' : 'Rafraichir'}
            </button>
            <button className="secondary-button logout-button" type="button" onClick={logout}>
              Deconnexion
            </button>
          </div>
        </header>

        <section className="metrics" aria-label="Synthese">
          <article className="metric">
            <span>Salles actives</span>
            <strong>{totals.activeRooms}</strong>
          </article>
          <article className="metric">
            <span>{isAdmin ? 'Reservations actives' : 'Mes reservations'}</span>
            <strong>{isAdmin ? totals.activeReservations : displayedReservations.length}</strong>
          </article>
          <article className="metric">
            <span>{isAdmin ? 'Heures reservees' : 'Mes heures'}</span>
            <strong>{isAdmin ? totals.bookedHours : visibleBookedHours}</strong>
          </article>
          <article className="metric">
            <span>Notifications</span>
            <strong>{totals.unread}</strong>
          </article>
          <article className="metric">
            <span>{isAdmin ? 'Employes actifs' : 'Reservations actives'}</span>
            <strong>{isAdmin ? totals.employees : visibleActiveReservations.length}</strong>
          </article>
        </section>

        {!isAdmin && (
        <section className="work-grid employee-grid">
          <section className="panel" id="rooms">
            <div className="panel-header">
              <div>
                <h2>Recherche de salles</h2>
                <span>Disponibilite, capacite et type</span>
              </div>
            </div>

            <form className="search-form" onSubmit={(event) => void searchAvailableRooms(event)}>
              <label>
                Date
                <input type="date" value={searchForm.date} onChange={(event) => setSearchForm({ ...searchForm, date: event.target.value })} />
              </label>
              <label>
                Debut
                <input type="time" value={searchForm.start} onChange={(event) => setSearchForm({ ...searchForm, start: event.target.value })} />
              </label>
              <label>
                Fin
                <input type="time" value={searchForm.end} onChange={(event) => setSearchForm({ ...searchForm, end: event.target.value })} />
              </label>
              <label>
                Capacite min
                <input
                  min="1"
                  type="number"
                  value={searchForm.minCapacity}
                  onChange={(event) => setSearchForm({ ...searchForm, minCapacity: event.target.value })}
                />
              </label>
              <label>
                Type
                <select value={searchForm.type} onChange={(event) => setSearchForm({ ...searchForm, type: event.target.value as RoomType | '' })}>
                  <option value="">Tous</option>
                  {roomTypes.map((type) => (
                    <option key={type} value={type}>
                      {roomTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Localisation
                <input value={searchForm.location} onChange={(event) => setSearchForm({ ...searchForm, location: event.target.value })} />
              </label>
              <button type="submit" disabled={loading}>
                Chercher salles disponibles
              </button>
              <button className="secondary-button" type="button" onClick={() => void loadData()}>
                Tous les espaces
              </button>
            </form>

            <div className="room-list">
              {rooms.map((room) => {
                const availability = room.id ? availabilityByRoom[room.id] : null
                return (
                  <article className="room-row" key={room.id ?? room.numero}>
                    <div>
                      <strong>{roomName(room)}</strong>
                      <span>
                        {roomTypeLabel(room.type)} / {room.capaciteMaximale} places / {room.localisation || '-'}
                      </span>
                    </div>
                    <div className="row-actions">
                      <span className={`availability ${availability === false ? 'busy' : availability === true ? 'free' : ''}`}>
                        {!room.active ? 'Desactivee' : availability === true ? 'Disponible' : availability === false ? 'Occupee' : 'Active'}
                      </span>
                      <button className="secondary-button" type="button" onClick={() => selectRoom(room)} disabled={!room.active}>
                        Choisir
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          <section className="panel booking-panel">
            <div className="panel-header">
              <div>
                <h2>Nouvelle reservation</h2>
                <span>Conflits horaires bloques par Redis + PostgreSQL</span>
              </div>
            </div>

            <form className="reservation-form" onSubmit={createReservation}>
              {isAdmin && (
                <label>
                  Employe
                  <select
                    value={reservationForm.employeeId}
                    onChange={(event) => setReservationForm({ ...reservationForm, employeeId: event.target.value })}
                  >
                    {employees
                      .filter((employee) => employee.actif)
                      .map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employeeName(employee)}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              <label>
                Salle
                <select value={reservationForm.roomId} onChange={(event) => setReservationForm({ ...reservationForm, roomId: event.target.value })}>
                  {activeRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {roomName(room)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Date
                <input
                  required
                  type="date"
                  value={reservationForm.dateReservation}
                  onChange={(event) => setReservationForm({ ...reservationForm, dateReservation: event.target.value })}
                />
              </label>
              <label>
                Debut
                <input
                  required
                  type="time"
                  value={reservationForm.heureDebut}
                  onChange={(event) => setReservationForm({ ...reservationForm, heureDebut: event.target.value })}
                />
              </label>
              <label>
                Fin
                <input
                  required
                  type="time"
                  value={reservationForm.heureFin}
                  onChange={(event) => setReservationForm({ ...reservationForm, heureFin: event.target.value })}
                />
              </label>
              <label className="wide-field">
                Motif
                <input
                  maxLength={180}
                  required
                  value={reservationForm.motif}
                  onChange={(event) => setReservationForm({ ...reservationForm, motif: event.target.value })}
                />
              </label>
              <button type="submit" disabled={saving || !session}>
                Enregistrer la reservation
              </button>
            </form>

            <img className="floor-plan" src={floorPlan} alt="Plan des salles" />
          </section>
        </section>
        )}

        <section className="panel" id="reservations">
          <div className="panel-header">
            <div>
              <h2>{isAdmin ? 'Toutes les reservations' : 'Mes reservations'}</h2>
              <span>{displayedReservations.length} lignes</span>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Salle</th>
                  <th>Employe</th>
                  <th>Date</th>
                  <th>Horaire</th>
                  <th>Motif</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedReservations.map((reservation) => (
                  <tr key={reservation.id ?? `${reservation.roomId}-${reservation.dateReservation}-${reservation.heureDebut}`}>
                    <td>{reservation.id ?? '-'}</td>
                    <td>{roomName(roomsById.get(reservation.roomId))}</td>
                    <td>{employeeName(employeesById.get(reservation.employeeId))}</td>
                    <td>{reservation.dateReservation}</td>
                    <td>
                      {shortTime(reservation.heureDebut)} - {shortTime(reservation.heureFin)}
                    </td>
                    <td>{reservation.motif || '-'}</td>
                    <td>
                      <span className={`status-pill ${reservation.statut.toLowerCase()}`}>{statusLabel(reservation.statut)}</span>
                    </td>
                    <td>
                      <button
                        className="secondary-button danger-button"
                        type="button"
                        disabled={reservation.statut === 'ANNULEE' || saving}
                        onClick={() => void cancelReservation(reservation.id)}
                      >
                        Annuler
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {isAdmin && (
          <section className="admin-grid" id="admin">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Gestion des salles</h2>
                  <span>{roomForm.id ? 'Modification' : 'Ajout'}</span>
                </div>
              </div>
              <form className="management-form" onSubmit={saveRoom}>
                <label>
                  Numero
                  <input required value={roomForm.numero} onChange={(event) => setRoomForm({ ...roomForm, numero: event.target.value })} />
                </label>
                <label>
                  Nom
                  <input required value={roomForm.nom} onChange={(event) => setRoomForm({ ...roomForm, nom: event.target.value })} />
                </label>
                <label>
                  Capacite
                  <input
                    min="1"
                    required
                    type="number"
                    value={roomForm.capaciteMaximale}
                    onChange={(event) => setRoomForm({ ...roomForm, capaciteMaximale: event.target.value })}
                  />
                </label>
                <label>
                  Type
                  <select value={roomForm.type} onChange={(event) => setRoomForm({ ...roomForm, type: event.target.value as RoomType })}>
                    {roomTypes.map((type) => (
                      <option key={type} value={type}>
                        {roomTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="wide-field">
                  Localisation
                  <input value={roomForm.localisation} onChange={(event) => setRoomForm({ ...roomForm, localisation: event.target.value })} />
                </label>
                <label className="check-field">
                  <input type="checkbox" checked={roomForm.active} onChange={(event) => setRoomForm({ ...roomForm, active: event.target.checked })} />
                  Active
                </label>
                <button type="submit" disabled={saving}>
                  Sauvegarder salle
                </button>
                <button className="secondary-button" type="button" onClick={() => setRoomForm(initialRoomForm)}>
                  Nouveau
                </button>
              </form>
              <div className="compact-list">
                {rooms.map((room) => (
                  <div className="compact-row" key={room.id ?? room.numero}>
                    <span>
                      <strong>{room.numero}</strong> {room.nom}
                    </span>
                    <div>
                      <button className="secondary-button" type="button" onClick={() => editRoom(room)}>
                        Modifier
                      </button>
                      <button className="secondary-button danger-button" type="button" onClick={() => void disableRoom(room)} disabled={!room.active}>
                        Desactiver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Gestion des employes</h2>
                  <span>{employeeForm.id ? 'Modification' : 'Ajout'}</span>
                </div>
              </div>
              <form className="management-form" onSubmit={saveEmployee}>
                <label>
                  Numero
                  <input
                    required
                    value={employeeForm.numeroEmploye}
                    onChange={(event) => setEmployeeForm({ ...employeeForm, numeroEmploye: event.target.value })}
                  />
                </label>
                <label>
                  Prenom
                  <input required value={employeeForm.prenom} onChange={(event) => setEmployeeForm({ ...employeeForm, prenom: event.target.value })} />
                </label>
                <label>
                  Nom
                  <input required value={employeeForm.nom} onChange={(event) => setEmployeeForm({ ...employeeForm, nom: event.target.value })} />
                </label>
                <label>
                  Email
                  <input required type="email" value={employeeForm.email} onChange={(event) => setEmployeeForm({ ...employeeForm, email: event.target.value })} />
                </label>
                <label>
                  Role
                  <select value={employeeForm.role} onChange={(event) => setEmployeeForm({ ...employeeForm, role: event.target.value as Role })}>
                    <option value="EMPLOYE">Employe</option>
                    <option value="ADMINISTRATEUR">Administrateur</option>
                  </select>
                </label>
                <label>
                  Departement
                  <input value={employeeForm.departement} onChange={(event) => setEmployeeForm({ ...employeeForm, departement: event.target.value })} />
                </label>
                <label className="wide-field">
                  Mot de passe
                  <input
                    type="password"
                    value={employeeForm.password}
                    onChange={(event) => setEmployeeForm({ ...employeeForm, password: event.target.value })}
                  />
                </label>
                <label className="check-field">
                  <input type="checkbox" checked={employeeForm.actif} onChange={(event) => setEmployeeForm({ ...employeeForm, actif: event.target.checked })} />
                  Actif
                </label>
                <button type="submit" disabled={saving}>
                  Sauvegarder employe
                </button>
                <button className="secondary-button" type="button" onClick={() => setEmployeeForm(initialEmployeeForm)}>
                  Nouveau
                </button>
              </form>
              <div className="compact-list">
                {employees.map((employee) => (
                  <div className="compact-row" key={employee.id ?? employee.email}>
                    <span>
                      <strong>{employeeName(employee)}</strong> {employee.role}
                    </span>
                    <div>
                      <button className="secondary-button" type="button" onClick={() => editEmployee(employee)}>
                        Modifier
                      </button>
                      <button className="secondary-button danger-button" type="button" onClick={() => void disableEmployee(employee)} disabled={!employee.actif}>
                        Desactiver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </section>
        )}

        <section className="bottom-grid" id={isAdmin ? 'audit' : 'notifications'}>
          <section className="panel" id="notifications">
            <div className="panel-header">
              <div>
                <h2>Notifications</h2>
                <span>{serviceStats.unreadNotifications ?? totals.unread} non lues</span>
              </div>
            </div>
            <div className="message-list">
              {visibleNotifications.map((notification) => (
                <article className="message-row" key={notification.id ?? notification.message}>
                  <div>
                    <strong>{notification.lue ? 'Lue' : 'Nouvelle'}</strong>
                    <span>{notification.message}</span>
                  </div>
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={notification.lue}
                    onClick={() => void markNotificationRead(notification)}
                  >
                    Marquer lue
                  </button>
                </article>
              ))}
            </div>
          </section>

          {isAdmin ? (
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Audit et services</h2>
                <span>{serviceStats.auditLogs ?? auditLogs.length} actions</span>
              </div>
            </div>
            <div className="audit-list">
              {auditLogs.slice(-8).reverse().map((log) => (
                <article className="audit-row" key={log.id ?? `${log.action}-${log.dateAction}`}>
                  <strong>{log.action}</strong>
                  <span>
                    User {log.utilisateurId} / {log.adresseIp || 'system'}
                  </span>
                </article>
              ))}
            </div>
            <div className="service-strip" aria-label="Ports des services">
              {services.map((service) => (
                <span key={service.name}>
                  {service.name} <strong>{service.port}</strong>
                </span>
              ))}
            </div>
          </section>
          ) : (
          <section className="panel account-panel">
            <div className="panel-header">
              <div>
                <h2>Compte employe</h2>
                <span>{session.email}</span>
              </div>
            </div>
            <div className="summary-list">
              <span>Role: {session.role}</span>
              <span>Reservations visibles: {displayedReservations.length}</span>
              <span>Dernier statut: {message}</span>
            </div>
          </section>
          )}
        </section>
      </section>
    </main>
  )
}

export default App
