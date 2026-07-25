import floorPlan from './assets/floor-plan.svg'
import './App.css'

const services = [
  { name: 'API Gateway', port: '8080', status: 'UP' },
  { name: 'Identity & Employee', port: '8081', status: 'UP' },
  { name: 'Room Service', port: '8082', status: 'UP' },
  { name: 'Reservation Service', port: '8083', status: 'UP' },
  { name: 'Notification Audit', port: '8084', status: 'UP' },
]

const reservations = [
  { room: 'Salle 101', employee: 'Oussama B.', time: '10:00 - 11:30', status: 'Confirmée' },
  { room: 'Salle 204', employee: 'Admin RH', time: '12:00 - 14:00', status: 'Confirmée' },
  { room: 'Salle 310', employee: 'Equipe IT', time: '15:00 - 16:00', status: 'En attente' },
]

function App() {
  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Navigation">
        <div className="brand">Room Reservation</div>
        <nav>
          <a href="#dashboard">Dashboard</a>
          <a href="#rooms">Rooms</a>
          <a href="#reservations">Reservations</a>
          <a href="#admin">Admin</a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Microservices starter</p>
            <h1>Système de réservation de salles</h1>
          </div>
          <button type="button">Nouvelle réservation</button>
        </header>

        <section className="metrics" aria-label="Service status">
          {services.map((service) => (
            <article key={service.name} className="metric">
              <span className="status-dot" aria-hidden="true" />
              <strong>{service.name}</strong>
              <span>Port {service.port}</span>
            </article>
          ))}
        </section>

        <section className="content-grid">
          <article className="panel panel-large" id="rooms">
            <div className="panel-header">
              <h2>Plan des salles</h2>
              <span>Redis protège les créneaux sensibles</span>
            </div>
            <img src={floorPlan} alt="Plan des salles et zones de réservation" />
          </article>

          <article className="panel" id="reservations">
            <div className="panel-header">
              <h2>Réservations du jour</h2>
              <span>PostgreSQL + vérification des conflits</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Salle</th>
                  <th>Employé</th>
                  <th>Horaire</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => (
                  <tr key={`${reservation.room}-${reservation.time}`}>
                    <td>{reservation.room}</td>
                    <td>{reservation.employee}</td>
                    <td>{reservation.time}</td>
                    <td>{reservation.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        </section>
      </section>
    </main>
  )
}

export default App
