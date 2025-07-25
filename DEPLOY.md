# Deploying to Google Cloud

This guide will walk you through deploying the application to Google Cloud using Google Cloud Build and Google Cloud Run.

## Prerequisites

1.  **Google Cloud Project:** You need a Google Cloud project with billing enabled.
2.  **gcloud CLI:** You need to have the `gcloud` command-line tool installed and configured for your project.
3.  **Enable APIs:** Enable the Cloud Build, Cloud Run, and Container Registry APIs for your project. You can do this with the following commands:

    ```bash
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable run.googleapis.com
    gcloud services enable containerregistry.googleapis.com
    ```

## Deployment Steps

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/zzfadi/toico.git
    cd toico
    ```

2.  **Set your Project ID:**

    Replace `[YOUR_PROJECT_ID]` with your Google Cloud project ID.

    ```bash
    export PROJECT_ID=[YOUR_PROJECT_ID]
    ```

3.  **Run Cloud Build:**

    This command will use the `cloudbuild.yaml` file to build the Docker image, push it to Google Container Registry, and deploy it to Google Cloud Run.

    ```bash
    gcloud builds submit --config cloudbuild.yaml .
    ```

4.  **Access your application:**

    Once the deployment is complete, you will see the URL of your deployed application in the output. You can also find the URL in the Google Cloud Console under Cloud Run.

## Continuous Deployment (Optional)

You can set up a trigger in Google Cloud Build to automatically deploy the application whenever you push changes to your Git repository.

1.  Go to the Cloud Build section in the Google Cloud Console.
2.  Go to the "Triggers" tab and click "Create trigger".
3.  Connect your repository and configure the trigger to use the `cloudbuild.yaml` file for the build configuration.
