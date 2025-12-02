pipeline {
    agent {
        docker {
            image 'docker/compose:latest'
            args '-v /var/run/docker.sock:/var/run/docker.sock'
        }
    }

    environment {
        COMPOSE_PROJECT_NAME = "formgpt-${env.BRANCH_NAME}"
    }


    stages {
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