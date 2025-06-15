# DevBoard - MERN Job Portal

A full-stack job portal application built with the MERN stack (MongoDB, Express.js, React, Node.js).

## Features

### For Job Seekers (Users)

- User registration and authentication
- Browse and search job listings
- Filter jobs by location, type, and keywords
- View detailed job descriptions
- Apply to jobs with resume upload
- Track application status

### For Employers (Admins)

- Admin registration and authentication
- Post new job listings
- Manage job postings
- View and manage applications
- Dashboard with analytics and statistics
- Update application status

## Tech Stack

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer for resume uploads

## Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   \`\`\`bash
   cd backend
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Create a `.env` file based on `.env.example`:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

4. Update the `.env` file with your MongoDB connection string and JWT secret.

5. Start the backend server:
   \`\`\`bash
   npm run dev
   \`\`\`

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   \`\`\`bash
   cd frontend
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Update the `config.js` file with your backend URL if needed.

4. Start the frontend development server:
   \`\`\`bash
   npm start
   \`\`\`

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /register` - Register user/admin
- `POST /login` - Login user

### Jobs

- `GET /jobs` - Fetch all job posts (with search/filter)
- `POST /jobs` - Admin: Create job
- `GET /jobs/:id` - Get job details

### Applications

- `POST /apply` - Apply to job with resume upload
- `GET /applications` - Get applications (user's own or all for admin)
- `GET /applications/:jobId` - Admin: Get applications for specific job
- `PUT /applications/:id` - Admin: Update application status

### Dashboard

- `GET /dashboard-data` - Admin: Get dashboard statistics
- `GET /my-jobs` - Admin: Get jobs posted by admin

## Database Models

### User

\`\`\`javascript
{
name: String,
email: String (unique),
passwordHash: String,
role: String (enum: ['user', 'admin']),
createdAt: Date
}
\`\`\`

### Job

\`\`\`javascript
{
title: String,
company: String,
description: String,
requirements: [String],
location: String,
type: String,
salary: String,
postedBy: ObjectId (ref: User),
postedAt: Date,
status: String (enum: ['active', 'closed'])
}
\`\`\`

### Application

\`\`\`javascript
{
jobId: ObjectId (ref: Job),
userId: ObjectId (ref: User),
resumeFilePath: String,
coverLetter: String,
status: String (enum: ['pending', 'reviewed', 'shortlisted', 'rejected']),
appliedAt: Date
}
\`\`\`

## Deployment

### Backend (Render/Heroku)

1. Create a new app on your hosting platform
2. Set environment variables (MONGODB_URI, JWT_SECRET, etc.)
3. Deploy the backend folder

### Frontend (Vercel/Netlify)

1. Update `config.js` with your deployed backend URL
2. Build the project: `npm run build`
3. Deploy the build folder

## Features to Add

- [ ] Email notifications for applications
- [ ] Advanced search with salary range filters
- [ ] Company profiles
- [ ] Job bookmarking
- [ ] Application tracking for users
- [ ] Resume parsing
- [ ] Interview scheduling
- [ ] Real-time notifications

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request
