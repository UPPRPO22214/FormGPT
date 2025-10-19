pipeline {
	agent any
	environment {
		DOCKER_IMAGE = 'survey-service'
		DOCKER_TAG = "${env.BRANCH_NAME}-${BUILD_NUMBER}"
		DOCKER_LATEST_TAG = "${env.BRANCH_NAME}-latest"
	}
	stages {
		stage('Build') {
		 steps {
				echo 'Building Docker image...'
				script {
					sh """
					docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} .
					docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:${DOCKER_LATEST_TAG}
					"""
				}
			}
		}
		stage('Deploy to Dev') {
			when {
				branch 'develop'
			}
			steps {
				echo 'Deploying application to development environment...'
				script {
					sh """
					# Остановить dev контейнер
					docker stop survey-service-dev || true
					docker rm survey-service-dev || true
					# Запустить на dev порту
					docker run -d --name survey-service-dev -p 5001:8081
					${DOCKER_IMAGE}:${DOCKER_TAG}
					echo "Dev deployment complete!"
					echo "  Access dev app at: http://localhost:5001"
					"""
				}
			}
		}
		stage('Deploy to Production') {
			when {
				branch 'main'
			}
			steps {
				echo 'Deploying application to production...'
				script {
					sh """
					# Остановить все контейнеры на порту 5000
					docker stop survey-service-prod || true
					docker rm survey-service-prod|| true
					# Запустить новый контейнер
					docker run -d --name survey-service-prod -p 5000:8081
					${DOCKER_IMAGE}:${DOCKER_TAG}
					"""
					echo "Application deployed successfully!"
					echo "  Access the app at: http://localhost:5000"
				}
			}
		}
	}
	post {
		success {
			echo "Pipeline completed successfully!"
		}
		failure {
			echo "Pipeline failed!"
		}
		always {
			echo "Cleaning up Docker images..."
			script {
				sh """
				# Удаляем неиспользованные образы
				docker image prune -f || true
				if [ "${env.BRANCH_NAME}" = "main" ] || [ "${env.BRANCH_NAME}" = "develop" ]; then
					echo "Keeping last 5 images for production branch: ${env.BRANCH_NAME}"
					# Оставляем только последние 5 образов для main/develop
					docker images ${DOCKER_IMAGE} --format "table {{.Repository}}:{{.Tag}}" | \
					grep "${env.BRANCH_NAME}-" | \
					sort -k2 -r | \
					tail -n +6 | \
					awk '{print $1}' | \
					xargs -r docker rmi || true
				else
					echo "Removing all images for feature branch: ${env.BRANCH_NAME}"
					# Удаляем ВСЕ образы feature веток после сборки
					docker images ${DOCKER_IMAGE} --format "table {{.Repository}}:{{.Tag}}" | \
					grep "${env.BRANCH_NAME}-" | \
					xargs -r docker rmi || true
				fi
				echo "Cleanup completed for branch: ${env.BRANCH_NAME}"
				"""
            }
        }
    }
}