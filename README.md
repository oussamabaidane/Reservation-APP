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
| CI/CD | GitLab CI |
| Quality | SonarQube |

## Architecture

```text
Local PC
   |
   v
GitLab Repository
   |
   v
GitLab CI/CD
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

## Git Flow

```text
main      -> stable branch
develop   -> integration branch
feature/* -> development branches
```
