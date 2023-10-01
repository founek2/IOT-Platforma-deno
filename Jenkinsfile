pipeline {
 	// Clean workspace before doing anything
    // deleteDir()
    agent any

    stages {
        stage('Building image') {
            agent { label 'java-docker-slave' }

            steps{
                script {
                    sh "ci/docker-build.sh"
                }
            }
        }
    }
}