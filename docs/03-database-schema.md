# 03 DATABASE SCHEMA

*Note: The current MVP uses an in-memory array to store jobs temporarily. The following is the planned schema for a persistent database (MySQL/MariaDB).* 

## Tables

### `users`
- `id` (PK)
- `email`
- `password_hash`

### `jobs`
- `id` (PK)
- `title`
- `company`
- `description`
- `url`
- `hrEmail`
- `status` (enum: Scraped, Email Generated, Sent, Opened)

### `generated_emails`
- `id` (PK)
- `job_id` (FK)
- `subject`
- `body`
- `sent_at`
- `opened_at`
