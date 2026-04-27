**Project**: Video Processing Application Frontend (Angular Client)

**Description**:

Frontend application for the video processing service that handles direct-to-cloud uploads and API integration.
(Note: HLS streaming playback is currently in development)

**Core Features**:

1. Direct S3 Upload (Multipart): Uploads heavy media files directly to AWS S3 via Presigned URLs, bypassing the backend server.
2. Status Tracking: Monitors the processing lifecycle of the video (Uploading -> Processing -> Completed/Failed) via REST API.
3. HLS Streaming (WIP): Preparing UI integration for adaptive video playback using generated .m3u8 master playlists.

**How it Works (Pipeline)**:

1. Upload: User uploads a file via front-end by presigned url into S3 bucket under temp/uploads/;
2. Notification: S3 triggers an event to AWS SQS;
3. Processing: The Worker module picks up the message, runs FFmpeg for transcoding, and uploads streamable HLS segments back to S3;
4. Metadata: Final file paths and track info are stored in PostgreSQL;


**Components**:

1. Angular App — UI and client-side logic
2. videoapp-web (Boot module) — REST API target
3. AWS S3 — Direct file upload destination


**Setting up**:

1. Create an S3 instance at AWS. Define an SQS queue and set an event-notification to the S3 with type 'Multipart upload completed', destination type 'SQS queue' destination as your queue and filter 'temp/uploads/'.

Manage CORS rules in order to access your bucket. Initially your JSON can look like this:

[
       {
           "AllowedHeaders": [
                "*"
           ],
           "AllowedMethods": [
                "GET",
                "PUT",
                "POST",
                "DELETE",
                "HEAD"
           ],
           "AllowedOrigins": [
                "*"
           ],
           "ExposeHeaders": [
                "ETag"
           ],
           "MaxAgeSeconds": 3000
       }
   ]
   
2. Create a file named .env for sensitive environment variables and fill it with following properties:

    WEB_SERVER_PORT=
    AWS_S3_BUCKET=
    AWS_ACCESS_KEY_ID=
    AWS_SQS_QUEUE_NAME=
    AWS_SECRET_ACCESS_KEY=
    AWS_REGION= 
    IS_S3_MODE_ENABLED= 
    DB_NAME= 
    DB_HOST=
    DB_PORT=
    DB_USER=
    DB_PASSWORD=

3. Set up the Docker
4. mvn clean install -> docker compose build -> docker compose up

http://localhost:5433/ - local access to the DB
