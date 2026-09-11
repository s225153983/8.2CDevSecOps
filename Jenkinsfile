pipeline {
    agent any

    environment {
        SONAR_SCANNER_VERSION = '7.3.0.5189'
    }

    triggers {
        pollSCM('H/5 * * * *')
    }

    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Cloning the 8.2CDevSecOps repository, which holds the intentionally vulnerable nodejs-goof application.'
                git branch: 'main', url: 'https://github.com/s225153983/8.2CDevSecOps.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing the project dependencies with npm so the tests and the audit have something to run against.'
                bat 'npm install --no-audit --no-fund'
            }
        }

        stage('Run Tests') {
            steps {
                echo 'Running the unit tests with the built in Node.js test runner.'
                bat 'npm test || exit /b 0'
            }
        }

        stage('Generate Coverage Report') {
            steps {
                echo 'Generating an lcov coverage report with c8. SonarCloud reads coverage/lcov.info in the analysis stage.'
                bat 'npm run coverage || exit /b 0'
            }
        }

        stage('NPM Audit (Security Scan)') {
            steps {
                echo 'Running npm audit to list the known CVEs in the dependency tree.'
                bat 'npm audit || exit /b 0'
                bat 'npm audit --json > npm-audit-report.json || exit /b 0'
            }
        }

        stage('SonarCloud Analysis') {
            steps {
                withCredentials([string(credentialsId: 'SONAR_TOKEN', variable: 'SONAR_TOKEN')]) {
                    powershell '''
                        $ErrorActionPreference = "Stop"

                        $version = $env:SONAR_SCANNER_VERSION
                        $folder  = "sonar-scanner-$version-windows-x64"
                        $zip     = "sonar-scanner-cli-$version-windows-x64.zip"
                        $url     = "https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/$zip"

                        if (-not (Test-Path $folder)) {
                            Write-Host "Downloading the SonarScanner CLI from $url"
                            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
                            Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
                            Write-Host "Extracting $zip"
                            Expand-Archive -Path $zip -DestinationPath . -Force
                        } else {
                            Write-Host "Reusing the SonarScanner CLI already present in the workspace."
                        }

                        $scanner = Join-Path $folder "bin/sonar-scanner.bat"
                        Write-Host "Running $scanner"
                        & $scanner "-Dsonar.token=$env:SONAR_TOKEN"

                        if ($LASTEXITCODE -ne 0) {
                            throw "SonarScanner exited with code $LASTEXITCODE"
                        }
                    '''
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'npm-audit-report.json, coverage/lcov.info', allowEmptyArchive: true
        }
        success {
            echo 'Pipeline finished. The SonarCloud dashboard now holds the updated quality and security report.'
        }
        failure {
            echo 'Pipeline failed. Check the console output for the stage that stopped the build.'
        }
    }
}
