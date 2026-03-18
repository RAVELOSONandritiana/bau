pipeline {
    agent any
    tools {
        nodejs 'node22'
    }

    stages {
        stage('Run On Main Only') {
            when {
                // S'assure que TOUT le pipeline n'est exécuté que si on pousse sur 'main'
                branch 'main'
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
                        // Le "--" indique à npm de passer les arguments suivants à la commande Angular (ng build)
                        sh 'npm run build -- --base-href /fonds-patrimoniaux/'
                    }
                }

                stage('Copy Build to Home') {
                    steps {
                        withCredentials([usernamePassword(credentialsId: 'sudoer', usernameVariable: 'SSH_USER', passwordVariable: 'SSH_PASS')]) {
                            // Utilise sshpass pour l'authentification par mot de passe et copie le dossier
                            sh '''
                            sshpass -p "$SSH_PASS" scp -o StrictHostKeyChecking=no -r dist $SSH_USER@192.168.1.183:/home/$SSH_USER/
                            '''
                        }
                    }
                }

                stage('Deploy to /var/www') {
                    steps {
                        withCredentials([usernamePassword(credentialsId: 'sudoer', usernameVariable: 'SSH_USER', passwordVariable: 'SSH_PASS')]) {
                            // Utilise sshpass pour se connecter et sudo pour la copie interne
                            sh '''
                            sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no $SSH_USER@192.168.1.183 "echo $SSH_PASS | sudo -S cp -r /home/$SSH_USER/dist/* /var/www/"
                            '''
                        }
                    }
                }
            } // Fin des sous-étapes
        } // Fin de l'étape principale "Run On Main Only"
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