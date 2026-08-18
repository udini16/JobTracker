# 04 API SPECIFICATIONS

All endpoints are prefixed with `/api`.

### `POST /scrape`
- **Payload**: `{ keyword, location }`
- **Response**: Array of scraped jobs.

### `POST /generate`
- **Payload**: `multipart/form-data` (resume text/file, jobId)
- **Response**: The updated job object containing `generatedEmail` (subject and body).

### `POST /send`
- **Payload**: `{ jobId }`
- **Response**: Success status.

### `GET /track/:jobId`
- **Description**: Hit by the email tracking pixel.
- **Response**: 1x1 transparent GIF.

### `GET /jobs`
- **Response**: Retrieves all jobs currently in the system.
