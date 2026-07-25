pipeline {
  agent none

  options {
    timestamps()
    skipDefaultCheckout(false)
  }

  stages {
    stage('Backend - Maven + JUnit') {
      agent {
        docker {
          image 'maven:3.9-eclipse-temurin-21'
          args '-v maven-cache:/root/.m2'
        }
      }
      steps {
        sh 'mvn -B clean verify'
      }
    }

    stage('Frontend - React + Vite') {
      agent {
        docker {
          image 'node:24-alpine'
        }
      }
      steps {
        dir('frontend') {
          sh 'npm ci'
          sh 'npm run lint'
          sh 'npm run build'
        }
      }
    }

    stage('SonarQube Analysis') {
      when {
        expression {
          return env.SONAR_TOKEN?.trim()
        }
      }
      agent {
        docker {
          image 'maven:3.9-eclipse-temurin-21'
          args '-v maven-cache:/root/.m2'
        }
      }
      steps {
        sh 'mvn -B verify sonar:sonar -Dsonar.host.url="${SONAR_HOST_URL:-http://sonarqube:9000}" -Dsonar.token="$SONAR_TOKEN"'
      }
    }

    stage('Docker Compose Validation') {
      agent {
        docker {
          image 'docker:cli'
          args '-v /var/run/docker.sock:/var/run/docker.sock'
        }
      }
      steps {
        sh 'docker compose config -q'
      }
    }
  }

  post {
    success {
      echo 'Pipeline completed successfully.'
    }
    failure {
      echo 'Pipeline failed. Check the stage logs.'
    }
  }
}
