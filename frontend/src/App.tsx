import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import floorPlan from './assets/floor-plan.svg'
import './App.css'

type ReservationStatus = 'EN_ATTENTE' | 'CONFIRMEE' | 'ANNULEE' | 'TERMINEE'

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

type ReservationForm = {
  employeeId: string
  roomId: string
  dateReservation: string
  heureDebut: string
  heureFin: string
  motif: string
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

const today = new Date().toISOString().slice(0, 10)

const initialForm: ReservationForm = {
  employeeId: '1',
  roomId: '1',
  dateReservation: today,
  heureDebut: '10:00',
  heureFin: '11:00',
  motif: 'Reunion projet',
}

const demoReservations: Reservation[] = [
  {
    id: 1,
    employeeId: 1,
    roomId: 1,
    dateReservation: today,
    heureDebut: '09:00',
    heureFin: '10:00',
    dureeMinutes: 60,
    motif: 'Daily team',
    statut: 'CONFIRMEE',
  },
  {
    id: 2,
    employeeId: 2,
    roomId: 3,
    dateReservation: today,
    heureDebut: '14:00',
    heureFin: '15:30',
    dureeMinutes: 90,
    motif: 'Comite RH',
    statut: 'EN_ATTENTE',
  },
]

const services = [
  { name: 'API Gateway', port: '8080' },
  { name: 'Identity', port: '8081' },
  { name: 'Rooms', port: '8082' },
  { name: 'Reservations', port: '8083' },
  { name: 'Audit', port: '8084' },
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

function App() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [form, setForm] = useState<ReservationForm>(initialForm)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [apiOnline, setApiOnline] = useState<boolean | null>(null)
  const [message, setMessage] = useState('Ready')

  const visibleReservations = apiOnline === false && reservations.length === 0 ? demoReservations : reservations

  const totals = useMemo(() => {
    const active = visibleReservations.filter((reservation) => reservation.statut !== 'ANNULEE').length
    const cancelled = visibleReservations.filter((reservation) => reservation.statut === 'ANNULEE').length
    const minutes = visibleReservations.reduce((sum, reservation) => sum + (reservation.dureeMinutes ?? 0), 0)

    return {
      active,
      cancelled,
      hours: Math.round((minutes / 60) * 10) / 10,
    }
  }, [visibleReservations])

  async function loadReservations() {
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE}/reservations`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = (await response.json()) as Reservation[]
      setReservations(data)
      setApiOnline(true)
      setMessage(data.length === 0 ? 'No reservations yet' : 'Reservations loaded')
    } catch {
      setApiOnline(false)
      setMessage('Backend offline - showing demo data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadReservations()
  }, [])

  async function createReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('Creating reservation...')

    const payload = {
      employeeId: Number(form.employeeId),
      roomId: Number(form.roomId),
      dateReservation: form.dateReservation,
      heureDebut: form.heureDebut,
      heureFin: form.heureFin,
      motif: form.motif,
      statut: 'CONFIRMEE',
    }

    try {
      const response = await fetch(`${API_BASE}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `HTTP ${response.status}`)
      }

      setForm({ ...initialForm, dateReservation: form.dateReservation })
      await loadReservations()
      setMessage('Reservation created')
    } catch (error) {
      setApiOnline(false)
      setMessage(error instanceof Error ? error.message : 'Reservation failed')
    } finally {
      setSaving(false)
    }
  }

  async function cancelReservation(id?: number) {
    if (!id) {
      return
    }

    setMessage('Cancelling reservation...')

    try {
      const response = await fetch(`${API_BASE}/reservations/${id}/cancel`, {
        method: 'PUT',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      await loadReservations()
      setMessage('Reservation cancelled')
    } catch {
      setMessage('Cancel failed')
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Navigation">
        <div className="brand">Reservation APP</div>
        <nav>
          <a href="#dashboard">Dashboard</a>
          <a href="#new-reservation">New reservation</a>
          <a href="#reservations">Reservations</a>
          <a href="#services">Services</a>
        </nav>
      </aside>

      <section className="workspace" id="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">Room booking</p>
            <h1>Systeme de reservation de salles</h1>
          </div>
          <button type="button" onClick={() => void loadReservations()} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </header>

        <section className="metrics" aria-label="Reservation summary">
          <article className="metric">
            <span className="metric-label">Active</span>
            <strong>{totals.active}</strong>
          </article>
          <article className="metric">
            <span className="metric-label">Cancelled</span>
            <strong>{totals.cancelled}</strong>
          </article>
          <article className="metric">
            <span className="metric-label">Hours booked</span>
            <strong>{totals.hours}</strong>
          </article>
          <article className="metric">
            <span className="metric-label">API</span>
            <strong className={apiOnline ? 'online' : 'offline'}>{apiOnline ? 'Online' : 'Offline'}</strong>
          </article>
        </section>

        <section className="content-grid">
          <section className="panel booking-panel" id="new-reservation">
            <div className="panel-header">
              <h2>New reservation</h2>
              <span>{message}</span>
            </div>

            <form className="reservation-form" onSubmit={createReservation}>
              <label>
                Employee ID
                <input
                  min="1"
                  required
                  type="number"
                  value={form.employeeId}
                  onChange={(event) => setForm({ ...form, employeeId: event.target.value })}
                />
              </label>
              <label>
                Room ID
                <input
                  min="1"
                  required
                  type="number"
                  value={form.roomId}
                  onChange={(event) => setForm({ ...form, roomId: event.target.value })}
                />
              </label>
              <label>
                Date
                <input
                  required
                  type="date"
                  value={form.dateReservation}
                  onChange={(event) => setForm({ ...form, dateReservation: event.target.value })}
                />
              </label>
              <label>
                Start
                <input
                  required
                  type="time"
                  value={form.heureDebut}
                  onChange={(event) => setForm({ ...form, heureDebut: event.target.value })}
                />
              </label>
              <label>
                End
                <input
                  required
                  type="time"
                  value={form.heureFin}
                  onChange={(event) => setForm({ ...form, heureFin: event.target.value })}
                />
              </label>
              <label className="wide-field">
                Motif
                <input
                  maxLength={180}
                  required
                  value={form.motif}
                  onChange={(event) => setForm({ ...form, motif: event.target.value })}
                />
              </label>

              <button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Create reservation'}
              </button>
            </form>
          </section>

          <section className="panel floor-panel">
            <div className="panel-header">
              <h2>Floor plan</h2>
              <span>Rooms overview</span>
            </div>
            <img src={floorPlan} alt="Room floor plan" />
          </section>
        </section>

        <section className="panel reservations-panel" id="reservations">
          <div className="panel-header">
            <h2>Reservations</h2>
            <span>{visibleReservations.length} rows</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Room</th>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Motif</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleReservations.map((reservation) => (
                  <tr key={reservation.id ?? `${reservation.roomId}-${reservation.dateReservation}-${reservation.heureDebut}`}>
                    <td>{reservation.id ?? '-'}</td>
                    <td>Room {reservation.roomId}</td>
                    <td>Employee {reservation.employeeId}</td>
                    <td>{reservation.dateReservation}</td>
                    <td>
                      {reservation.heureDebut} - {reservation.heureFin}
                    </td>
                    <td>{reservation.motif || '-'}</td>
                    <td>
                      <span className={`status-pill ${reservation.statut.toLowerCase()}`}>
                        {statusLabel(reservation.statut)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => void cancelReservation(reservation.id)}
                        disabled={reservation.statut === 'ANNULEE' || apiOnline === false}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="service-strip" id="services" aria-label="Service ports">
          {services.map((service) => (
            <span key={service.name}>
              {service.name} <strong>{service.port}</strong>
            </span>
          ))}
        </section>
      </section>
    </main>
  )
}

export default App
