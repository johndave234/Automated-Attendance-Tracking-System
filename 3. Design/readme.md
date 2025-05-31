Automated Attendance Tracking System
Overview
The Automated Attendance Tracking System is a web-based application designed to streamline attendance management for universities. It enables authorized users to register students and instructors, manage attendance via barcode scanning, and generate attendance reports. The system emphasizes role-based access control (RBAC), multi-factor authentication (MFA), and secure cloud deployment.

Features
User Management: Register and manage students, instructors, and administrators with role-based access control.

Attendance Tracking: Record attendance via barcode scanning using registered devices.

Reporting: Generate detailed attendance reports for courses and students.

Security: Implement MFA for instructor logins, RBAC, and encryption for sensitive data.

Cloud Deployment: Hosted on cloud infrastructure with auto-scaling capabilities.

System Architecture
Frontend
Technology: Expo.js (Single Page Application)

Components:

Instructor interface for scanning barcodes.

Student portal to view attendance records.

Admin dashboard for managing users and generating reports.

Backend
Technology: Spring Boot REST API

Functionality:

Handles RBAC, MFA, and CRUD operations.

Processes attendance logic and generates reports.

Database
Technology: MySQL or MongoDB Atlas

Tables/Collections:

users: Stores user credentials and roles.

students: Contains student profiles and photos.

instructors: Manages instructor data and registered devices.

attendance_logs: Records attendance timestamps and course details.

devices: Tracks registered devices for attendance recording.

API Endpoints
Endpoint	Method	Description	Auth Role
/api/register/student	POST	Register a student	Authorized User
/api/register/instructor	POST	Register an instructor	Authorized User
/api/attendance/scan	POST	Submit scanned barcode	Instructor
/api/attendance/student/{id}	GET	View student attendance	Student
/api/reports/attendance	GET	Generate attendance report	Admin
/api/auth/login	POST	Login with MFA	All
Security
Role-Based Access Control (RBAC): Enforced for Admin, Instructor, and Student roles.

Multi-Factor Authentication (MFA): Required for instructor logins.

Data Encryption: Sensitive data is encrypted.

Transport Layer Security (TLS): HTTPS using SSL for secure communication.

Technology Stack
Frontend: Expo.js

Backend: Spring Boot

Database: MySQL / MongoDB Atlas

Authentication: Spring Security + MFA

Cloud Deployment: AWS/Azure/GCP

Data Flow
Registration: Authorized users register students/instructors, and the system stores their data in the database.

Attendance: Instructors scan barcodes, and the system validates and records timestamped attendance.

Viewing: Students log in to view their attendance per course.

Reporting: Admins generate attendance summary reports.

Assumptions & Constraints
QR scanning requires camera-enabled devices.

University users must register manually via the web dashboard.

The system does not integrate with other university APIs (per requirement R05.03).

Timeline
Initial System Check: May 15, 2025

Full Deployment: May 22, 2025

Requirement Traceability
For a detailed mapping of requirements to use cases, refer to the Requirement Traceability Matrix.

Conceptual Diagram
Conceptual Diagram

Use Case Diagram
Use Case Diagram

For further details, refer to the [High-Level Design Document](Automated-Attendance-Tracking-System High-Level Design Document.docx).


