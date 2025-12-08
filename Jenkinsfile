pipeline {
    agent any

    environment {
        POSTGRES_DB = "${env.POSTGRES_DB ?: 'survey'}"
        POSTGRES_USER = credentials('9dba7a41-0e00-416c-a2e4-b981a3d8711b')
        POSTGRES_PASSWORD = credentials('ec53b390-40e3-42f8-931f-d67352ddb1be')
        GIGACHAT_CREDENTIALS = credentials('985545c7-9661-4fdf-a341-500ed9cc8b6c')
        COMPOSE_PROJECT_NAME = "survey_${normalizeBranchName(env.BRANCH_NAME)}"
        IS_PRODUCTION = "${env.BRANCH_NAME == 'main'}"
        COMPOSE_FILE = "${env.BRANCH_NAME == 'main' ? 'docker-compose.prod.yml' : 'docker-compose.yml'}"
    }

    stages {
        stage('Build') {
            steps {
                echo "Building on branch: ${env.BRANCH_NAME}"
                echo "Using compose file: ${env.COMPOSE_FILE}"

                withCredentials([
                    certificate(credentialsId: 'ssl_certificate', keystoreVariable: 'KEYSTORE'),
                    string(credentialsId: 'ssl_p12_password', variable: 'KEYSTORE_PASS')
                ]) {
                    sh '''
                        set -euo pipefail

                        echo "Workspace: $WORKSPACE"
                        mkdir -p "$WORKSPACE/nginx/ssl"


                        openssl pkcs12 -in "$KEYSTORE" -nocerts -nodes -passin pass:"$KEYSTORE_PASS" \
                          | sed -ne '/-----BEGIN PRIVATE KEY-----/,/-----END PRIVATE KEY-----/p' \
                          > "$WORKSPACE/nginx/ssl/privkey.pem"


                        openssl pkcs12 -in "$KEYSTORE" -clcerts -nokeys -passin pass:"$KEYSTORE_PASS" \
                          > "$WORKSPACE/nginx/ssl/fullchain.pem"

                        chmod 644 "$WORKSPACE/nginx/ssl/fullchain.pem"
                        chmod 644 "$WORKSPACE/nginx/ssl/privkey.pem"

                        echo "SSL files created in $WORKSPACE/nginx/ssl"

                        # Копируем SSL файлы для frontend если нужно
                        if [ -d "$WORKSPACE/frontend" ]; then
                            mkdir -p "$WORKSPACE/frontend/nginx/ssl"
                            cp "$WORKSPACE/nginx/ssl/fullchain.pem" "$WORKSPACE/frontend/nginx/ssl/"
                            cp "$WORKSPACE/nginx/ssl/privkey.pem" "$WORKSPACE/frontend/nginx/ssl/"
                        fi
                    '''
                }

                // Собираем с правильным compose файлом
                sh '''
                    docker-compose version
                    docker-compose -f "${COMPOSE_FILE}" build --pull --no-cache
                '''
            }
        }

        stage('Deploy') {
            steps {
                script {
                    if (env.BRANCH_NAME == 'main') {
                        echo 'Deploying to PRODUCTION (main branch)...'
                        sh '''
                            set -euo pipefail
                            # Используем тот же compose файл, что и при сборке
                            docker-compose -f "${COMPOSE_FILE}" down || true
                            docker-compose -f "${COMPOSE_FILE}" up -d
                            sleep 10
                            docker-compose -f "${COMPOSE_FILE}" ps
                        '''
                    } else {
                        echo "Deploying non-production branch: ${env.BRANCH_NAME}"
                        sh '''
                            set -euo pipefail
                            docker-compose -f "${COMPOSE_FILE}" up -d
                            sleep 15

                            echo "Checking containers..."
                            docker-compose -f "${COMPOSE_FILE}" ps

                            # Проверяем, что все сервисы запущены
                            all_up=$(docker-compose -f "${COMPOSE_FILE}" ps --services | while read service; do
                                if docker-compose -f "${COMPOSE_FILE}" ps -q $service > /dev/null 2>&1 && \
                                   docker-compose -f "${COMPOSE_FILE}" ps $service | grep -q "Up"; then
                                    echo "up"
                                fi
                            done | grep -c "up")

                            total_services=$(docker-compose -f "${COMPOSE_FILE}" ps --services | wc -l)

                            if [ "$all_up" -eq "$total_services" ]; then
                                echo "All $total_services services running OK"
                            else
                                echo "ERROR: Some services not running"
                                docker-compose -f "${COMPOSE_FILE}" logs || true
                                exit 1
                            fi
                        '''

                        echo "Stopping after test"
                        sh 'docker-compose -f "${COMPOSE_FILE}" down'
                    }
                }
            }
        }
    }


    post {
        success {
            telegramSend message: '✅ Build #${BUILD_NUMBER} ветки ${BRANCH_NAME} успешно завершён!'
        }
        always {
            echo "Running cleanup..."

            sh '''
                set -euo pipefail
                echo "Cleaning branch ${BRANCH_NAME}"

                docker image prune -f || true

                # Сохраняем образы для main и develop, для остальных удаляем
                if [ "${BRANCH_NAME}" = "main" ] || [ "${BRANCH_NAME}" = "develop" ]; then
                    echo "Production/develop branch, preserving images"
                else
                    echo "Removing images for ${BRANCH_NAME}"
                    docker images --format "{{.Repository}}:{{.Tag}}" |
                    grep "${BRANCH_NAME}" |
                    xargs -r docker rmi -f || true

                    docker-compose --project-directory "$WORKSPACE" down || true
                fi


            '''
        }

        failure {
            echo "Pipeline failed!"
            sh '''
                if [ "${BRANCH_NAME}" = "main" ]; then
                    echo "Production deploy failed → logs:"
                    docker-compose --project-directory "$WORKSPACE" logs || true
                fi
            '''
            telegramSend message: '❌ Build #${BUILD_NUMBER} ветки ${BRANCH_NAME} провален!'
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