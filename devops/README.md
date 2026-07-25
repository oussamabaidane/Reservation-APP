# DevOps Stack

This project includes a local DevOps stack for CI, code quality, and monitoring.

## Services

| Tool | URL | Default login | Purpose |
|---|---|---|---|
| Jenkins | http://localhost:8086 | setup wizard disabled | Run the `Jenkinsfile` pipeline |
| SonarQube | http://localhost:9000 | `admin` / `admin` on first login | Code quality analysis |
| Prometheus | http://localhost:9090 | none | Scrapes Spring Boot metrics |
| Grafana | http://localhost:3000 | `admin` / `admin` | Dashboards and monitoring |

## Start Everything

```bash
docker compose up -d --build
```

## Start Only DevOps Tools

```bash
docker compose up -d prometheus grafana jenkins sonarqube sonar-db
```

## Monitoring Flow

```text
Spring Boot actuator /actuator/prometheus
        |
        v
Prometheus
        |
        v
Grafana dashboard
```

Grafana is provisioned automatically with:

- Prometheus datasource
- `Room Reservation Overview` dashboard

## Jenkins Flow

The repository contains a `Jenkinsfile` with these stages:

```text
Backend - Maven + JUnit
Frontend - React + Vite
SonarQube Analysis
Docker Compose Validation
```

For Jenkins Docker-based agents, install/enable these Jenkins plugins if your Jenkins instance asks for them:

```text
Pipeline
Git
Docker Pipeline
Credentials Binding
```

Add `SONAR_TOKEN` in Jenkins credentials/environment before running the SonarQube stage.

## SonarQube Note

If SonarQube fails to start on Linux, run this on the Docker host:

```bash
sudo sysctl -w vm.max_map_count=524288
sudo sysctl -w fs.file-max=131072
```

On Docker Desktop for Windows, this is usually handled by Docker Desktop.
