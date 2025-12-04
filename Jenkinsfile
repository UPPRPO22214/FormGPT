pipeline {
    agent any

    environment {
        POSTGRES_DB = "${env.POSTGRES_DB ?: 'survey'}"
        POSTGRES_USER = credentials('9dba7a41-0e00-416c-a2e4-b981a3d8711b')
        POSTGRES_PASSWORD = credentials('ec53b390-40e3-42f8-931f-d67352ddb1be')
        GIGACHAT_CREDENTIALS = credentials('985545c7-9661-4fdf-a341-500ed9cc8b6c')
        COMPOSE_PROJECT_NAME = "survey_${normalizeBranchName(env.BRANCH_NAME)}"

    stages {
        stage('Build') {
            steps {
                echo "Building on branch: ${env.BRANCH_NAME}"
                sh """
                    docker-compose version
                    docker-compose build
                """
            }
        }

        stage('Deploy') {
            steps {
                script {
                    if (env.BRANCH_NAME == 'main') {
                        echo 'Deploying to PRODUCTION (main branch)...'
                        // Останавливаем предыдущий композ
                        sh 'docker-compose down || true'

                        // Запускаем с пробросом порта 80
                        sh '''
                            docker-compose up -d
                            # Проверяем, что контейнер запустился
                            sleep 10
                            docker-compose ps
                        '''

                        // Дополнительная проверка работы
                        sh '''
                            # Проверяем доступность сервиса
                            max_retries=30
                            retry_count=0
                            while [ $retry_count -lt $max_retries ]; do
                                if curl -f http://localhost:80/health || curl -f http://localhost/health; then
                                    echo "Application is UP and running on port 80"
                                    break
                                fi
                                echo "Waiting for application to start... ($retry_count/$max_retries)"
                                retry_count=$((retry_count + 1))
                                sleep 5
                            done

                            if [ $retry_count -eq $max_retries ]; then
                                echo "ERROR: Application failed to start"
                                docker-compose logs
                                exit 1
                            fi
                        '''
                    } else {
                        echo "Deploying and testing NON-PRODUCTION branch: ${env.BRANCH_NAME}"

                        // Запускаем композ
                        sh '''
                            docker-compose up -d
                            # Даем время на запуск
                            sleep 15
                        '''

                        // Проверяем, что все сервисы запустились
                        sh '''
                            # Проверяем статус контейнеров
                            echo "Checking container status..."
                            docker-compose ps

                            # Проверяем, что все сервисы в состоянии "Up"
                            all_up=$(docker-compose ps --services | while read service; do
                                if [ "$(docker-compose ps -q $service)" ] && [ "$(docker-compose ps $service | grep -c "Up")" -eq 1 ]; then
                                    echo "up"
                                fi
                            done | grep -c "up")

                            total_services=$(docker-compose ps --services | wc -l)

                            if [ "$all_up" -eq "$total_services" ]; then
                                echo "✅ All $total_services services are running successfully"

                                # Необязательно: можно проверить доступность сервиса
                                echo "Testing service availability..."
                                # Здесь можно добавить проверку curl на внутренний порт
                                # Например: curl -f http://localhost:8080/health || true
                            else
                                echo "❌ Not all services are running"
                                docker-compose logs
                                exit 1
                            fi
                        '''

                        // После успешной проверки останавливаем
                        echo "Test successful, stopping containers..."
                        sh 'docker-compose down'
                    }
                }
            }
        }
    }

    post {
        always {
            echo "Starting cleanup..."
            sh '''
                echo "Cleaning up for branch: ${BRANCH_NAME}"

                docker image prune -f || true

                if [ "${BRANCH_NAME}" = "main" ] || [ "${BRANCH_NAME}" = "develop" ]; then
                    echo "Keeping images for production branch: ${BRANCH_NAME}"
                    # Для main ветки не удаляем контейнеры (они продолжают работать)
                else
                    echo "Removing feature branch images for: ${BRANCH_NAME}"
                    docker images --format "{{.Repository}}:{{.Tag}}" |
                    grep "${BRANCH_NAME}" |
                    xargs -r docker rmi -f || true

                    # Для feature веток удаляем все связанные контейнеры
                    docker-compose down || true
                fi

                echo "Cleanup completed"
            '''
        }

        failure {
            echo "Pipeline failed!"
            // Для main ветки логируем ошибки
            sh '''
                if [ "${BRANCH_NAME}" = "main" ]; then
                    echo "Production deployment failed! Checking logs..."
                    docker-compose logs || true
                fi
            '''
        }
    }
}

def normalizeBranchName(branchName) {
    if (!branchName) return "unknown"

    // Приводим к нижнему регистру
    def normalized = branchName.toLowerCase()

    // Заменяем недопустимые символы на подчеркивания
    normalized = normalized.replaceAll('[^a-z0-9-]', '_')

    // Удаляем ведущие и завершающие подчеркивания
    normalized = normalized.replaceAll('^_+|_+$', '')

    // Удаляем последовательные подчеркивания
    normalized = normalized.replaceAll('_+', '_')

    // Обрезаем длину (Docker имеет ограничение на длину имен)
    if (normalized.length() > 30) {
        normalized = normalized.substring(0, 30)
    }

    if (normalized.isEmpty()) {
        normalized = "branch_" + UUID.randomUUID().toString().substring(0, 8)
    }

    return normalized
}