# Automated Attendance Tracking System

## Overview

The Automated Attendance Tracking System is a comprehensive solution that simplifies attendance management for educational institutions. It enables students to mark their attendance via QR codes or manual codes, instructors to manage courses and generate attendance codes, and administrators to oversee all system operations.

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- MongoDB
- Expo CLI for mobile app development
- Web browser for web access

### Installation

1. **Clone the repository**

   ```
   git clone https://github.com/yourusername/Automated-Attendance-Tracking-System.git
   cd Automated-Attendance-Tracking-System-main/5.\ Implementations/AutomatedAttendance
   ```
2. **Install dependencies**

   ```
   npm install
   cd client
   npm install
   cd ..
   ```
3. **Configure the backend**

   - Navigate to `/backend/config`
   - Update database connection in `db.js`
   - Set up environment variables as needed
4. **Start the system**

   ```
   # Start backend server
   npm run server

   # In a new terminal, start the client
   cd client
   npm start
   ```

## System Usage

### For Students

1. **Login**

   - Use your student ID and password on the login screen
   - Select "Student" as the user type
2. **Dashboard**

   - View enrolled courses
   - Check attendance statistics
   - Access quick actions for all courses
3. **Managing Courses**

   - View all enrolled courses
   - Enroll in new courses using enrollment codes
   - See course details including schedule and instructor
4. **Recording Attendance**

   - Scan QR Code: Click "Scan QR" and scan the code displayed by your instructor
   - Manual Code: Click "Enter Code" and input the attendance code provided by your instructor

### For Instructors

1. **Login**

   - Use your instructor ID and password
   - Select "Instructor" as the user type
2. **Dashboard**

   - View courses you're teaching
   - See upcoming classes
   - Access quick actions
3. **Managing Courses**

   - Create new courses with course code, name, and schedule
   - Edit existing course details
   - View enrolled students
4. **Taking Attendance**

   - Generate QR code: Click "Generate QR" on the course screen
   - Generate manual code: Click "Generate Code" for a numeric code students can enter
   - View attendance history and statistics

### For Administrators

1. **Login**

   - Use your admin credentials
   - Select "Admin" as the user type
2. **User Management**

   - Create, edit, or delete student accounts
   - Create, edit, or delete instructor accounts
   - Manage user permissions
3. **Course Management**

   - Create and assign courses
   - Monitor all courses in the system
   - Handle course enrollment issues
4. **System Statistics**

   - View attendance rates across all courses
   - Generate reports on attendance patterns
   - Track system usage

## Troubleshooting

### Connection Issues

- Ensure MongoDB is running and properly configured
- Check that the backend server is running on port 5001
- Verify network connectivity between client and server

### Login Problems

- Confirm user credentials are correct
- Ensure the user account exists in the system
- Check server logs for authentication errors

### Attendance Recording Issues

- QR scanning requires camera permissions
- Ensure the attendance session is active
- Verify the student is enrolled in the course

## Support

For additional support, please contact the system administrator or refer to the detailed documentation in the project repository.
