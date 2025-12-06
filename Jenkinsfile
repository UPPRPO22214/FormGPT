pipeline {
    agent any

    environment {
        POSTGRES_DB = "${env.POSTGRES_DB ?: 'survey'}"
        POSTGRES_USER = credentials('9dba7a41-0e00-416c-a2e4-b981a3d8711b')
        POSTGRES_PASSWORD = credentials('ec53b390-40e3-42f8-931f-d67352ddb1be')
        GIGACHAT_CREDENTIALS = credentials('985545c7-9661-4fdf-a341-500ed9cc8b6c')
        COMPOSE_PROJECT_NAME = "survey_${normalizeBranchName(env.BRANCH_NAME)}"
    }

    stages {
        stage('Build') {
            steps {
                echo "Building on branch: ${env.BRANCH_NAME}"
                sh """
                    docker-compose version
                    docker-compose build --pull --no-cache
                """
            }
        }

        stage('Deploy') {
            steps {
                script {
                    if (env.BRANCH_NAME != 'main') {
                        echo 'Deploying to PRODUCTION (main branch)...'
                        withCredentials([certificate(
                            credentialsId: 'ssl_certificate',
                            keystoreVariable: 'KEYSTORE',
                            keystorePasswordVariable: 'KEYSTORE_PASS'
                        )]) {
                            sh '''
                                mkdir -p nginx/ssl

                                # KEYSTORE — это путь к временному p12-файлу, сгенерированному Jenkins.
                                # KEYSTORE_PASS — пароль, который Jenkins автоматически генерирует.

                                # Извлекаем приватный ключ
                                openssl pkcs12 -in "$KEYSTORE" -nocerts -nodes -passin pass:"$KEYSTORE_PASS" \
                                    | sed -ne '/-----BEGIN PRIVATE KEY-----/,/-----END PRIVATE KEY-----/p' \
                                    > nginx/ssl/privkey.pem

                                # Извлекаем сертификат (полную цепочку)
                                openssl pkcs12 -in "$KEYSTORE" -clcerts -nokeys -passin pass:"$KEYSTORE_PASS" \
                                    > nginx/ssl/fullchain.pem

                                chmod 600 nginx/ssl/privkey.pem nginx/ssl/fullchain.pem
                            '''
                        }
                        sh 'docker-compose down || true'

                        sh '''
                            docker-compose -f docker-compose.prod.yml up -d
                            sleep 10
                            docker-compose ps
                        '''

                        sh '''
                            max_retries=30
                            retry_count=0
                            while [ $retry_count -lt $max_retries ]; do
                                if docker exec survey_main-nginx-1 curl -fsS http://localhost/api/health; then
                                    echo "Application is UP"
                                    break
                                fi
                                echo "Waiting... ($retry_count/$max_retries)"
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
                        echo "Deploying non-production branch: ${env.BRANCH_NAME}"

                        sh '''
                            docker-compose up -d
                            sleep 15
                        '''

                        sh '''
                            echo "Checking containers..."
                            docker-compose ps

                            all_up=$(docker-compose ps --services | while read service; do
                                if [ "$(docker-compose ps -q $service)" ] && [ "$(docker-compose ps $service | grep -c "Up")" -eq 1 ]; then
                                    echo "up"
                                fi
                            done | grep -c "up")

                            total_services=$(docker-compose ps --services | wc -l)

                            if [ "$all_up" -eq "$total_services" ]; then
                                echo "All $total_services services running OK"
                            else
                                echo "ERROR: Some services not running"
                                docker-compose logs
                                exit 1
                            fi
                        '''

                        echo "Stopping after test"
                        sh 'docker-compose down'
                    }
                }
            }
        }
    }

    post {
        success {
            telegramSend message: '✅ Build #${BUILD_NUMBER} успешно завершён!'
        }
        always {
            echo "Running cleanup..."

            sh '''
                echo "Cleaning branch ${BRANCH_NAME}"

                docker image prune -f || true

                if [ "${BRANCH_NAME}" = "main" ] || [ "${BRANCH_NAME}" = "develop" ]; then
                    echo "Production branch, preserving images"
                else
                    echo "Removing images for ${BRANCH_NAME}"
                    docker images --format "{{.Repository}}:{{.Tag}}" |
                    grep "${BRANCH_NAME}" |
                    xargs -r docker rmi -f || true

                    docker-compose down || true
                fi
                shred -u nginx/ssl/privkey.pem || rm -f nginx/ssl/privkey.pem
                rm -f nginx/ssl/fullchain.pem
                echo "Cleanup done"

            '''
        }

        failure {
            echo "Pipeline failed!"
            sh '''
                if [ "${BRANCH_NAME}" = "main" ]; then
                    echo "Production deploy failed → logs:"
                    docker-compose logs || true
                fi
            '''
            telegramSend message: '❌ Build #${BUILD_NUMBER} провален!'
            }
    }
}

def normalizeBranchName(branchName) {
    if (!branchName) return "unknown"
    def normalized = branchName.toLowerCase()
    normalized = normalized.replaceAll('[^a-z0-9-]', '_')
    normalized = normalized.replaceAll('^_+|_+$', '')
    normalized = normalized.replaceAll('_+', '_')
    if (normalized.length() > 30) {
        normalized = normalized.substring(0, 30)
    }
    if (normalized.isEmpty()) {
        normalized = "branch_" + UUID.randomUUID().toString().substring(0, 8)
    }
    return normalized
}
