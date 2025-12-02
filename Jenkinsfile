pipeline {
   agent any

     environment {
        COMPOSE_PROJECT_NAME = "formgpt-${env.BRANCH_NAME}"

        POSTGRES_DB = "${env.POSTGRES_DB ?: 'survey'}"
        POSTGRES_USER = credentials('postgres user')
        POSTGRES_PASSWORD = credentials('postgres-password')
        GIGACHAT_CREDENTIALS = credentials('gigachat-token')
    }


    stages {
     stages {
        stage('Prepare') {
            steps {
                script {
                    sh '''
                    export POSTGRES_DB=${POSTGRES_DB}
                    export POSTGRES_USER=${POSTGRES_USER}
                    export POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
                    export GIGACHAT_CREDENTIALS=${GIGACHAT_CREDENTIALS}
                    '''
                }
            }
        }


        stage('Build') {
            steps {
                echo "Building on branch: ${env.BRANCH_NAME}"
                script {
                    sh """
                    docker-compose version
                    docker-compose build
                    """
                }
            }
        }

        stage('Deploy') {
            when {
                // Only deploy if NOT main branch
                not { branch 'main' }
            }
            steps {
                echo 'Deploying application...'
                script {
                    sh """
                    docker-compose down || true
                    docker-compose up -d
                    """
                    echo "Application deployed successfully!"
                    echo "Access the app at: http://localhost"
                }
            }
        }
    }

    post {
        always {
            echo "Starting cleanup..."
            script {
                // Fixed cleanup script using Jenkins env variable
                sh '''
                echo "Cleaning up for branch: ${BRANCH_NAME}"

                # Remove dangling images
                docker image prune -f || true

                # Branch-specific cleanup logic
                if [ "${BRANCH_NAME}" = "main" ] || [ "${BRANCH_NAME}" = "develop" ]; then
                    echo "Keeping images for production branch: ${BRANCH_NAME}"
                else
                    echo "Removing feature branch images for: ${BRANCH_NAME}"
                    # Find and remove images tagged with this branch
                    docker images --format "{{.Repository}}:{{.Tag}}" | \
                    grep "${BRANCH_NAME}" | \
                    xargs -r docker rmi -f || true
                fi

                echo "Cleanup completed"
                '''
            }
        }
    }
}