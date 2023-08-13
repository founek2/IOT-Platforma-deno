pipeline {
 	// Clean workspace before doing anything
    // deleteDir()
    agent any

    stages {
        stage('Building image') {
            agent { label 'java-docker-slave' }

            steps{
                script {
                    sh "ci/jenkins/docker-build.sh"
                }
            }
        }

        stage('Deploy') {
            environment {
                TRIGGER_API_KEY = credentials('docker-compose-trigger-api-key-free')
            }

            steps {
                sh 'curl  -X POST -H  "X-API-Key: $TRIGGER_API_KEY" --ipv4 http://free.iotplatforma.cloud:9020/trigger/IOT-zigbee-prod'
            }
        }
    }
}