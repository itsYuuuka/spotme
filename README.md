# SpotMe

A full-stack workout tracking PWA for you and your gym buddy. Log sessions, track progress, and stay accountable with your training partner.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Go, Chi
- **Database**: PostgreSQL

## Features

- Workout templates with drag-to-reorder exercises
- Live session logging with sets, reps, and weight
- Workout history and per-exercise progress tracking
- Friend system with shared activity feed

## Getting Started

### Prerequisites
- Go 1.25+
- PostgreSQL 16+
- Node.js 18+

### Database
Create a database and run the migrations:
```bash
createdb spotme
psql spotme -f migrations/001_create_users.sql
psql spotme -f migrations/002_create_workout_templates.sql
psql spotme -f migrations/003_create_sessions.sql
psql spotme -f migrations/004_create_friendships.sql
psql spotme -f migrations/005_create_session_exercises.sql
```

### Backend
Create a `.env` file in the root directory:
```env
DATABASE_URL=postgres://user:password@localhost:5432/spotme?sslmode=disable
JWT_SECRET=your-secret-key
PORT=8080
```
```bash
go run ./cmd/api
```

### Frontend
Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:8080
```
```bash
cd client
npm install
npm run dev
```
