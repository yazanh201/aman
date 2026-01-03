
## 🔄 Recent Changes (Cloud Migration)

The following files were **changed / added** as part of the migration from
local file storage to Google Cloud Storage (GCS):

- `upload.middleware.js` – switched from disk storage to memory + GCS upload

- `gcs.js` – **new**: Google Cloud Storage configuration and connection "בתוך תיקיית config להוסיף"

- `log.routes.js` – updated to use GCS upload middleware
- `upload.routes.js` – updated upload endpoints for GCS
- `upload.controller.js` – adjusted to work with GCS URLs instead of local paths
- `log.controller.js` – updated log creation/update logic to store GCS URLs
- `server.js` – initializes GCS connection on server startup
- `.env` – added GCP and GCS environment variables (local only)

מה שצריך להוסיף ל enviroment variables "קובץ .env" :
GCP_PROJECT_ID=amana-sys-dockered
GCS_BUCKET_NAME=amanaphotos