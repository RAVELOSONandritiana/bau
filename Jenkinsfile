pipeline {
    agent any
    tools {
        nodejs 'node22'
    }

    stages {
        stage('Checkout') {
            steps {
                // Récupère le code depuis le dépôt configuré dans le job Jenkins
                checkout scm
            }
        }

        stage('Build') {
            steps {
                // Installe les dépendances et build le projet
                sh 'npm install'
                sh 'npm run build'
            }
        }

        stage('Copy Build to Home') {
            steps {
                sshagent(['ssh-server-credentials']) {
                    // Copie le dossier dist vers /home/bu
                    sh '''
                    scp -o StrictHostKeyChecking=no -r dist bu@192.168.1.183:/home/bu/
                    '''
                }
            }
        }

        stage('Deploy to /var/www') {
            steps {
                sshagent(['ssh-server-credentials']) {
                    // Utilise le mot de passe sudo depuis le credential 'sudoer'
                    withCredentials([string(credentialsId: 'sudoer', variable: 'SUDO_PASS')]) {
                        // Fait ssh dans le serveur et copie le contenu de dist vers /var/www/
                        sh '''
                        ssh -o StrictHostKeyChecking=no bu@192.168.1.183 "echo $SUDO_PASS | sudo -S cp -r /home/bu/dist/* /var/www/"
                        '''
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Déploiement terminé avec succès !"
        }
        failure {
            echo "Erreur lors du build ou déploiement."
        }
    }
}