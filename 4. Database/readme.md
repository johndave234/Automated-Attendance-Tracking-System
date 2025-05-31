# Student Attendance System

This project is a backend database structure for managing student attendance, instructors, and course-related data. It organizes data into clearly defined collections for seamless attendance tracking and logging of user activities.

## 📂 Collections Overview

The system uses the following MongoDB collections:

### 1. `Students`
Stores information related to enrolled students such as:
- Student ID
- Full Name
- Course Enrolled
- Year Level
- Other relevant student details

### 2. `Instructor`
Contains data about instructors:
- Instructor ID
- Name
- Assigned Courses
- Department

### 3. `Courses`
Holds information about courses offered:
- Course ID
- Course Name
- Course Code
- Instructor Reference

### 4. `AttendanceSession`
Represents a session during which attendance is taken:
- Session ID
- Course Reference
- Instructor Reference
- Date and Time of Session

### 5. `Attendance`
Tracks student attendance per session:
- Attendance ID
- Student Reference
- Attendance Session Reference
- Status (Present, Absent, Late)

### 6. `Userslogs`
Logs user activity within the system:
- Log ID
- User ID
- Activity Description
- Timestamp

## 🛠️ Technologies Used
- **Database:** MongoDB
- **Backend Framework:** (You can specify Node.js, Spring Boot, or whatever applies)
- **Frontend:** (Optional, e.g., React.js if applicable)

## 📌 Features
- Store and retrieve student and instructor records
- Manage course details and instructor assignments
- Record and monitor student attendance per session
- Log user actions for tracking and audit purposes

## 🚀 Getting Started

To run this project locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/student-attendance-system.git


