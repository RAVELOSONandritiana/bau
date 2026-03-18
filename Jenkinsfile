pipeline {
    agent any
    tools {
        nodejs 'node22'
    }

    triggers {
        // Ce bloc dit à Jenkins de se lancer automatiquement lorsqu'on pousse sur le dépôt (via webhook GitHub/GitLab par ex)
        githubPush() 
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