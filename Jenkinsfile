pipeline {
    agent any  // Utilise n'importe quel agent avec Node.js installé
    tools {
        nodejs 'node22'  // correspond au nom que tu as donné
    }

    environment {
        IMAGE_NAME = "192.168.1.183:5000/biblio_numerique-app"
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        REGISTRY = "192.168.1.183:5000"
    }

    stages {
        stage('Install dependencies') {
            steps {
                // Installe les dépendances Node.js
                sh 'npm install'
            }
        }

        stage('Build Angular Universal') {
            steps {
                // Build Angular Universal
                sh 'npm run build:ssr'
            }
        }

        stage('Archive build output') {
            steps {
                // Archive simplement le dossier dist pour le récupérer plus tard
                archiveArtifacts artifacts: 'dist/**', fingerprint: true
            }
        }

        stage('Deploy on server') {
            steps {
                sshagent(['ssh-server-credentials']) {
                    // Copie simplement les fichiers build sur le serveur via rsync ou scp
                    sh """
                    ssh -o StrictHostKeyChecking=no user@192.168.1.183 '
                        mkdir -p /var/www/biblio_numerique
                    '
                    scp -r dist/* user@192.168.1.183:/var/www/biblio_numerique/
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Deployment terminé avec succès !"
        }
        failure {
            echo "Erreur lors du build ou déploiement."
        }
    }
}