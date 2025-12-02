pipeline {
    agent any
    environment {
    }
    stages {
        stage('Build') {
            steps {
                echo 'Building Docker compose...'
                script {
                    sh """
                    docker-compose build
                    """
                }
            }
        }
        stage('Deploy to Production') {
            when {
                not branch 'main'
            }
            steps {
                echo 'Deploying application to production...'
                script {
                    sh """
                    docker-compose stop
                    docker-compose rm -f
                    docker-compose up -d
                    """
                    echo "Application deployed successfully!"
                    echo "  Access the app at: http://localhost"
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
                sh '''
                # Удаляем неиспользованные образы
                docker image prune -f || true

                if [ "' + env.BRANCH_NAME + '" = "main" ] || [ "' + env.BRANCH_NAME + '" = "develop" ]; then
                    echo "Keeping last 5 images for production branch: ' + env.BRANCH_NAME + '"
                    # Оставляем только последние 5 образов для main/develop
                    docker images survey-service --format "table {{.Repository}}:{{.Tag}}" | \
                    grep "' + env.BRANCH_NAME + '-" | \
                    sort -k2 -r | \
                    tail -n +6 | \
                    awk '"'"'{print $1}'"'"' | \
                    xargs -r docker rmi || true
                else
                    echo "Removing all images for feature branch: ' + env.BRANCH_NAME + '"
                    # Удаляем ВСЕ образы feature веток после сборки
                    docker images survey-service --format "table {{.Repository}}:{{.Tag}}" | \
                    grep "' + env.BRANCH_NAME + '-" | \
                    xargs -r docker rmi || true
                fi
                echo "Cleanup completed for branch: ' + env.BRANCH_NAME + '"
                '''
            }
        }
    }
}