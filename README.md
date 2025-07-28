# InceptIQ - AI-Powered Learning Platform

A modern learning platform that transforms documents into interactive learning experiences using AI-generated summaries, flashcards, and quizzes.

## Features

- **User Authentication**: Secure login and registration system
- **Document Processing**: Upload PDFs and generate AI-powered content
- **Interactive Learning**:
  - Comprehensive summaries with structured formatting
  - Interactive flashcards for knowledge retention
  - Adaptive quizzes with multiple-choice questions
- **User-Specific Content**: Each user has their own private topics
- **Modern UI**: Beautiful, responsive interface built with Angular and Tailwind CSS

## Tech Stack

### Backend

- **NestJS**: Modern Node.js framework
- **TypeORM**: Database ORM with SQLite (easily convertible to PostgreSQL)
- **JWT**: Secure authentication with JSON Web Tokens
- **bcryptjs**: Password hashing
- **Google Gemini AI**: AI content generation
- **SQLite**: Database (can be migrated to PostgreSQL)

### Frontend

- **Angular 17**: Modern frontend framework
- **Tailwind CSS**: Utility-first CSS framework
- **PrimeNG**: UI component library
- **RxJS**: Reactive programming

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Google Gemini API key

### Backend Setup

1. **Navigate to backend directory**:

   ```bash
   cd backend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the backend directory:

   ```env
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   GEMINI_API_KEY=your-gemini-api-key-here
   ```

4. **Start the development server**:
   ```bash
   npm run start:dev
   ```

The backend will be available at `http://localhost:3000`

### Frontend Setup

1. **Navigate to frontend directory**:

   ```bash
   cd frontend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:4200`

## API Endpoints

### Authentication

- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Topics (Protected Routes)

- `GET /api/topics` - Get user's topics
- `POST /api/topics/upload` - Upload and process a document
- `GET /api/topics/:id` - Get specific topic
- `DELETE /api/topics/:id` - Delete a topic

## Database Schema

### Users Table

- `id` (Primary Key)
- `email` (Unique)
- `password` (Hashed)
- `firstName`
- `lastName`
- `isActive`
- `createdAt`
- `updatedAt`

### Topics Table

- `id` (Primary Key)
- `name`
- `summary` (JSON string)
- `flashcards` (JSON string)
- `quiz` (JSON string)
- `userId` (Foreign Key to Users)
- `createdAt`
- `updatedAt`

## Usage

1. **Register/Login**: Create an account or sign in
2. **Upload Document**: Upload a PDF document to create a new topic
3. **Explore Content**:
   - View AI-generated summaries
   - Study with interactive flashcards
   - Test knowledge with quizzes
4. **Manage Topics**: View all your topics and delete as needed

## Migration to PostgreSQL

To migrate from SQLite to PostgreSQL:

1. **Install PostgreSQL dependencies**:

   ```bash
   npm install pg @types/pg
   ```

2. **Update database configuration** in `backend/src/config/database.config.ts`:

   ```typescript
   export const databaseConfig: TypeOrmModuleOptions = {
     type: "postgres",
     host: "localhost",
     port: 5432,
     username: "your_username",
     password: "your_password",
     database: "inceptiq",
     entities: [__dirname + "/../**/*.entity{.ts,.js}"],
     synchronize: true,
     logging: true,
   };
   ```

3. **Update environment variables**:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/inceptiq
   ```

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **JWT Authentication**: Secure token-based authentication
- **User Isolation**: Each user can only access their own topics
- **Input Validation**: Comprehensive validation using class-validator
- **CORS Protection**: Configured for secure cross-origin requests

## Development

### Backend Development

- **Hot Reload**: `npm run start:dev`
- **Build**: `npm run build`
- **Test**: `npm run test`

### Frontend Development

- **Hot Reload**: `npm start`
- **Build**: `npm run build`
- **Test**: `npm run test`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
