# Room Reservation System

Microservices starter architecture for a room reservation project.

## Technical Stack

| Layer | Choice |
|---|---|
| Backend | Spring Boot Java |
| Frontend | React + Vite |
| Database | PostgreSQL |
| Cache / concurrency locks | Redis |
| Authentication | JWT + refresh token starter, BCrypt password hashing |
| Internal messages | Internal events V1, no RabbitMQ for now |
| Containers | Docker + Docker Compose |
| CI/CD | GitHub Actions + Jenkins |
| Quality | SonarQube |
| Monitoring | Prometheus + Grafana |

## Architecture

```text
Local PC
   |
   v
GitHub Repository
   |
   v
GitHub Actions / Jenkins
   |
Maven -> JUnit -> SonarQube
   |
Docker images
   |
Docker Compose / Shared deployment server
   |
   +--------------------+--------------------+
   |                    |                    |
API Gateway       Frontend React        PostgreSQL
   |
   +------------------------------------------------+
   |                    |             |             |
Identity & Employee  Room Service  Reservation  Notification
Service                            Service      Audit Service
                                      |
                                     Redis
                          Reservation locks / conflicts
```

## Services

| Service | Port | Responsibility |
|---|---:|---|
| API Gateway | 8080 | Routes all API traffic |
| Identity & Employee Service | 8081 | Employees, roles, login, tokens |
| Room Service | 8082 | Rooms, capacity, type, location |
| Reservation Service | 8083 | Availability, conflict detection, Redis locks |
| Notification & Audit Service | 8084 | Notifications, audit logs, statistics |
| Frontend | 8085 | React + Vite web app |
| Jenkins | 8086 | Local CI/CD pipeline runner |
| SonarQube | 9000 | Code quality dashboard |
| Prometheus | 9090 | Metrics collection |
| Grafana | 3000 | Monitoring dashboards |

## Run Locally

```bash
docker compose up --build
```

Health endpoints:

```text
GET http://localhost:8081/health
GET http://localhost:8082/health
GET http://localhost:8083/health
GET http://localhost:8084/health
GET http://localhost:8080/health
```

## Build Backend

```bash
mvn clean verify
```

## Build Frontend

```bash
cd frontend
npm install
npm run build
```

## CI/CD

GitHub Actions runs automatically on pushes and pull requests targeting `develop` or `main`.

```text
Maven + JUnit
React + Vite build
Optional SonarQube analysis
Docker Compose validation and image build
```

Jenkins can also run the local `Jenkinsfile` pipeline:

```text
Backend - Maven + JUnit
Frontend - React + Vite
SonarQube Analysis
Docker Compose Validation
```

To enable SonarQube, add these repository secrets:

```text
SONAR_HOST_URL
SONAR_TOKEN
```

## DevOps And Monitoring

Start the local DevOps stack:

```bash
docker compose up -d prometheus grafana jenkins sonarqube sonar-db
```

Local URLs:

```text
Grafana:    http://localhost:3000  admin / admin
Prometheus: http://localhost:9090
Jenkins:    http://localhost:8086
SonarQube:  http://localhost:9000  admin / admin
```

More details: `devops/README.md`

## Git Flow

```text
main      -> stable branch
develop   -> integration branch
feature/* -> development branches
```
