pipeline {
    agent any

    environment {

        POSTGRES_DB = "${env.POSTGRES_DB ?: 'survey'}"
        POSTGRES_USER = credentials('9dba7a41-0e00-416c-a2e4-b981a3d8711b')
        POSTGRES_PASSWORD = credentials('ec53b390-40e3-42f8-931f-d67352ddb1be')
        GIGACHAT_CREDENTIALS = credentials('985545c7-9661-4fdf-a341-500ed9cc8b6c')
    }
    //TODO: add stage for all branches with compose up and down without port forwarding

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
            when {
                not { branch 'main' }
            }
            steps {
                echo 'Deploying application...'
                sh """
                    docker-compose down || true
                    docker-compose up -d
                """
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
                else
                    echo "Removing feature branch images for: ${BRANCH_NAME}"
                    docker images --format "{{.Repository}}:{{.Tag}}" |
                    grep "${BRANCH_NAME}" |
                    xargs -r docker rmi -f || true
                fi

                echo "Cleanup completed"
            '''
        }
    }
}
