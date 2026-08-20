# 00 GETTING STARTED


## System Requirements

- **OS**: Windows 11
- **RAM**: 16GB (Minimum: 8GB, but 16GB recommended for smooth operation)
- **Disk Space**: ~10GB free (for Node.js, database, and dependencies)
- **Node.js**: v20.x or higher
- **Database**: MySQL or MariaDB
- **Browser**: Modern browser supporting Tailwind CSS

## Installation Guide

### 1. Backend Setup (Server)

```bash
# Navigate to the server directory
cd c:\Users\User\Udini\VSCODE\React\jobportal\server

# Install dependencies
npm install

# Create a .env file from the example
cp .env.example .env

# Configure your database credentials in .env
DB_HOST=localhost
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=your_db_name

# Import the database schema
source docs/database.sql

# Start the server
npm start
```

The server will start on `http://localhost:3000`

### 2. Frontend Setup (Client)

```bash
# Navigate to the client directory
cd c:\Users\User\Udini\VSCODE\React\jobportal\client

# Install dependencies
npm install

# Start the development server
npm run dev
```

The client will start on `http://localhost:5173`

## Usage

1. Open the client in your browser: `http://localhost:5173`
2. Enter your resume text in the "Your Resume" section
3. Use the "Scrape Jobs" section to search for jobs
4. The AI will generate personalized emails for each job
5. Review and send emails using the "Send" buttons

## Database

The database schema is located at `docs/database.sql`

Tables include:
- `users`: User authentication
- `jobs`: Job postings
- `generated_emails`: AI-generated emails
- `applications`: Application tracking
