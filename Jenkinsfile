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
                sh '''
                    docker-compose version
                    docker-compose build --pull --no-cache
                '''
            }
        }

        stage('Deploy') {
            steps {
                script {
                    // Правильная логика: main = production
                    if (env.BRANCH_NAME != 'main') {
                        echo 'Deploying to PRODUCTION (main branch)...'

                        // Сертификат из Jenkins credentials: KEYSTORE — путь к временному p12-файлу в воркспейсе агента
                        withCredentials([
                            certificate(credentialsId: 'ssl_certificate', keystoreVariable: 'KEYSTORE'),
                            string(credentialsId: 'ssl_p12_password', variable: 'KEYSTORE_PASS')
                        ]) {
                            // Создаём папку nginx/ssl в рабочем каталоге (WORKSPACE) — именно этот каталог будет использовать docker-compose
                            sh '''
                                set -euo pipefail

                                echo "Workspace: $WORKSPACE"
                                mkdir -p "$WORKSPACE/nginx/ssl"

                                # Извлекаем приватный ключ (из временного p12 файла, предоставленного Jenkins)
                                openssl pkcs12 -in "$KEYSTORE" -nocerts -nodes -passin pass:"$KEYSTORE_PASS" \
                                  | sed -ne '/-----BEGIN PRIVATE KEY-----/,/-----END PRIVATE KEY-----/p' \
                                  > "$WORKSPACE/nginx/ssl/privkey.pem"

                                # Извлекаем сертификат (полную цепочку)
                                openssl pkcs12 -in "$KEYSTORE" -clcerts -nokeys -passin pass:"$KEYSTORE_PASS" \
                                  > "$WORKSPACE/nginx/ssl/fullchain.pem"

                                chmod 600 "$WORKSPACE/nginx/ssl/privkey.pem" "$WORKSPACE/nginx/ssl/fullchain.pem"

                                echo "SSL files created in $WORKSPACE/nginx/ssl"
                                ls -la "$WORKSPACE/nginx/ssl" || true

                                mkdir -p "$WORKSPACE/frontend/nginx/ssl"
                                cp "$WORKSPACE/nginx/ssl/fullchain.pem" "$WORKSPACE/frontend/nginx/ssl/"
                                cp "$WORKSPACE/nginx/ssl/privkey.pem" "$WORKSPACE/frontend/nginx/ssl/"

                            '''
                        }

                        // Останавливаем предыдущую конфигурацию (без ошибок)
                        sh 'docker-compose --project-directory "$WORKSPACE" -f "$WORKSPACE/docker-compose.prod.yml" down || true'

                        // Запускаем прод-проекты, указывая project-directory = WORKSPACE чтобы bind-mountы брались из воркспейса
                        sh '''
                            set -euo pipefail
                            docker-compose --project-directory "$WORKSPACE" -f "$WORKSPACE/docker-compose.prod.yml" up -d
                            sleep 10
                            docker-compose --project-directory "$WORKSPACE" -f "$WORKSPACE/docker-compose.prod.yml" ps

                            # диагностика mount'ов для nginx
                            nginx_id=$(docker ps --filter "name=nginx" -q || true)
                            if [ -n "$nginx_id" ]; then
                                echo "Nginx mounts:"
                                docker inspect "$nginx_id" --format '{{json .Mounts}}' || true
                            fi
                        '''

                    } else {
                        echo "Deploying non-production branch: ${env.BRANCH_NAME}"

                        sh '''
                            set -euo pipefail
                            docker-compose --project-directory "$WORKSPACE" up -d
                            sleep 15
                        '''

                        sh '''
                            echo "Checking containers..."
                            docker-compose --project-directory "$WORKSPACE" ps

                            all_up=$(docker-compose --project-directory "$WORKSPACE" ps --services | while read service; do
                                if [ "$(docker-compose --project-directory "$WORKSPACE" ps -q $service)" ] && [ "$(docker-compose --project-directory "$WORKSPACE" ps $service | grep -c "Up")" -eq 1 ]; then
                                    echo "up"
                                fi
                            done | grep -c "up")

                            total_services=$(docker-compose --project-directory "$WORKSPACE" ps --services | wc -l)

                            if [ "$all_up" -eq "$total_services" ]; then
                                echo "All $total_services services running OK"
                            else
                                echo "ERROR: Some services not running"
                                docker-compose --project-directory "$WORKSPACE" logs || true
                                exit 1
                            fi
                        '''

                        echo "Stopping after test"
                        sh 'docker-compose --project-directory "$WORKSPACE" down'
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
                if [ "${BRANCH_NAME}" != "main" ] || [ "${BRANCH_NAME}" = "develop" ]; then
                    echo "Production/develop branch, preserving images"
                else
                    echo "Removing images for ${BRANCH_NAME}"
                    docker images --format "{{.Repository}}:{{.Tag}}" |
                    grep "${BRANCH_NAME}" |
                    xargs -r docker rmi -f || true

                    docker-compose --project-directory "$WORKSPACE" down || true
                fi

                # Удаляем ssl из воркспейса
                shred -u "$WORKSPACE/nginx/ssl/privkey.pem" || rm -f "$WORKSPACE/nginx/ssl/privkey.pem" || true
                rm -f "$WORKSPACE/nginx/ssl/fullchain.pem" || true
                echo "Cleanup done"
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