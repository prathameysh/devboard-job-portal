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

## Project Structure

\`\`\`
root/
├── backend/
│ └── server.js # Complete backend logic
└── frontend/
├── App.js # Main React component
├── config.js # Backend URL configuration
└── screens/ # All screen components
├── Login.js
├── Register.js
├── JobList.js
├── JobDetail.js
├── Dashboard.js
├── JobPost.js
└── Applications.js
\`\`\`

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

## License

This project is licensed under the MIT License.

.
.
.
.
.
.
.
.
.
.
.
..

# DevBoard - Complete Developer Job Portal

## 🎯 **What is DevBoard?**

DevBoard is a **full-stack web application** that connects job seekers with employers in the tech industry. Think of it as a specialized LinkedIn Jobs or Indeed, but focused specifically on developer positions. It's built using modern web technologies and provides a complete hiring ecosystem.

---

## 👥 **Who Can Use It?**

### **Job Seekers (Users)**

- Developers looking for new opportunities
- Can browse, search, and apply to jobs
- Track their application status

### **Employers (Admins)**

- Companies and recruiters posting jobs
- Can manage job listings and review applications
- Access to analytics and dashboard

---

## 🏗️ **Technical Architecture**

### **Frontend (What Users See)**

- **Technology**: React.js with modern JavaScript
- **Styling**: Tailwind CSS for beautiful, responsive design
- **Structure**: Single Page Application (SPA) with multiple screens

### **Backend (Server & Database)**

- **Server**: Node.js with Express.js framework
- **Database**: MongoDB for storing all data
- **Authentication**: JWT (JSON Web Tokens) for secure login
- **File Storage**: Local file system for resume uploads

---

## 📁 **Project Structure**

```plaintext
DevBoard/
├── frontend/                 # React application (what users interact with)
│   ├── App.js               # Main application component
│   ├── config.js            # API configuration
│   ├── screens/             # All the different pages
│   │   ├── Login.js         # Login page
│   │   ├── Register.js      # Sign-up page
│   │   ├── JobList.js       # Browse all jobs
│   │   ├── JobDetail.js     # Individual job details
│   │   ├── Dashboard.js     # Admin control panel
│   │   ├── JobPost.js       # Create new job posting
│   │   └── Applications.js  # View applications
│   └── package.json         # Dependencies and scripts
│
├── backend/                 # Server application
│   ├── server.js           # Complete backend logic (1 file!)
│   ├── uploads/            # Stored resume files
│   ├── package.json        # Server dependencies
│   └── .env               # Environment variables (you create this)
│
└── README.md              # Complete setup instructions
```

---

## ✨ **Complete Feature Breakdown**

### 🔐 **Authentication System**

- **User Registration**: Create account as Job Seeker or Employer
- **Secure Login**: Email/password authentication with JWT tokens
- **Role-Based Access**: Different features for users vs admins
- **Demo Accounts**: Pre-built accounts for testing

- Admin: `admin@demo.com` / `demo123`
- User: `user@demo.com` / `demo123`

### 💼 **Job Management (For Employers)**

- **Post Jobs**: Create detailed job listings with:

- Job title, company, location
- Full description and requirements
- Job type (Full-time, Part-time, Contract, Internship)
- Salary range (optional)

- **Manage Listings**: Edit, delete, or close job postings
- **Application Tracking**: See who applied and when

### 🔍 **Job Discovery (For Job Seekers)**

- **Browse Jobs**: View all available positions
- **Advanced Search**: Filter by:

- Keywords (job title, company)
- Location
- Job type
- Salary range

- **Job Details**: Complete job descriptions with requirements
- **Application Status**: Track your submitted applications

### 📄 **Application System**

- **Resume Upload**: Support for PDF, DOC, DOCX files (max 5MB)
- **Cover Letters**: Optional personalized messages
- **Application Tracking**: Status updates (Pending → Reviewed → Shortlisted/Rejected)
- **Duplicate Prevention**: Can't apply twice to the same job

### 📊 **Admin Dashboard**

- **Analytics**: Visual charts and statistics

- Total jobs posted
- Application counts
- Pending reviews
- Monthly trends

- **Application Management**:

- Review applications
- Download resumes
- Update application status
- Contact applicants directly

- **Job Overview**: Manage all your job postings in one place

---

## 🎨 **User Experience Features**

### **Responsive Design**

- Works perfectly on desktop, tablet, and mobile
- Modern, clean interface
- Intuitive navigation

### **Real-time Feedback**

- Loading states for all actions
- Success/error messages
- Form validation with helpful error messages

### **Security Features**

- Password hashing (bcrypt)
- JWT token authentication
- File type validation
- Input sanitization
- Role-based permissions

---

## 🚀 **How to Get Started**

### **Prerequisites**

- Node.js (version 14+)
- MongoDB (local installation or cloud service)
- Basic command line knowledge

### **Quick Setup**

1. **Download & Extract** the project files
2. **Install Dependencies**:

```shellscript
cd backend && npm install
cd ../frontend && npm install
```

3. **Setup Environment**:

1. Create `.env` files with database and API configurations

1. **Start the Application**:

```shellscript
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm start
```

5. **Access the App**: Open `http://localhost:3000`

---

## 🌐 **Deployment Ready**

### **Backend Deployment** (Heroku, Railway, Render)

- Environment variables for production
- MongoDB Atlas for cloud database
- File upload handling

### **Frontend Deployment** (Vercel, Netlify)

- Automatic API URL detection
- Production build optimization
- Environment-based configuration

---

## 🔧 **Technical Highlights**

### **Database Models**

- **Users**: Name, email, password, role
- **Jobs**: Title, company, description, requirements, location, type, salary
- **Applications**: Job reference, user reference, resume file, cover letter, status

### **API Endpoints**

- Authentication: `/register`, `/login`
- Jobs: `/jobs` (GET/POST), `/jobs/:id` (GET/DELETE)
- Applications: `/apply`, `/applications`, `/applications/:id`
- Admin: `/dashboard-data`, `/my-jobs`

### **File Handling**

- Multer for file uploads
- File type validation
- Size limits (5MB)
- Secure file serving

---

## 🎯 **Perfect For**

- **Learning**: Great example of full-stack development
- **Portfolio**: Showcase your development skills
- **Startups**: Ready-to-use job portal for tech companies
- **Customization**: Easy to extend with new features

---

## 🚀 **Future Enhancement Ideas**

- Email notifications for applications
- Advanced search with salary filters
- Company profiles and branding
- Interview scheduling system
- Real-time chat between employers and candidates
- Resume parsing and skill matching
- Job recommendation engine

---

This is a **production-ready application** that demonstrates modern web development practices, secure authentication, file handling, database management, and responsive design. It's perfect for anyone wanting to understand how real-world web applications are built and deployed! 🎉
