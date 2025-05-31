Attendance Scanning Testing
This document outlines the testing procedure for a QR code-based attendance scanning system. The purpose is to validate that the system correctly updates the attendance database when a user scans their QR code.

Overview
The attendance scanning feature was tested in four main steps:

Database Before Scanning

Initial state of the database is recorded to establish a baseline.
No changes are expected prior to the QR scan.
Scanning QR Code

A test QR code is scanned using the system's scanning function.
This step triggers the back-end logic to update the attendance record.
Database After Scanning

The database is reviewed again after the scan.
Changes (such as a new timestamp or entry) confirm that the scan was successful.
Test Scan

A controlled scan test is conducted to verify that:
The QR code is correctly read.
The corresponding database entry is accurately updated.
No duplication or data corruption occurs.
Purpose
The goal of this testing is to ensure that the QR attendance system:

Accurately records user attendance
Reflects real-time changes in the database
Handles multiple scans without failure
Notes
Ensure the database is backed up before performing test scans.
Time and user information should be consistent with the expected outcome.
This test does not cover security or edge-case scenarios (e.g., invalid QR codes).
📦 API and Unit Testing Documentation
📑 Overview
This repository contains testing workflows and documentation for:

API Testing using Postman – focused on verifying API endpoints related to student, instructor, course, and enrollment management.
Unit Testing using Jest – for validating JavaScript logic and behavior with automated tests.
🔍 API Testing using Postman
📌 Purpose
To validate the RESTful API endpoints ensuring correct behavior, status codes, and data structure for key modules.

📁 Modules Covered
Student Creation

Test student registration endpoints.
Validate successful creation and proper error handling.
Instructor

Test instructor account management endpoints.
Ensure accurate data saving and retrieval.
Course

Create and update course-related data.
Validate input fields and API responses.
Student Enrollment

Test student enrollment in available courses.
Confirm correct linking between students and courses.
🛠️ Tools Used
Postman
RESTful API endpoints
✅ Notes
Tests include positive and negative scenarios.
Expected HTTP response codes are validated (200, 201, 400, etc.).
Request payloads and responses follow expected schemas.
🧪 Unit Testing with Jest
📖 Purpose
To perform unit testing on core JavaScript functions using Jest, ensuring each function behaves as expected under various scenarios.

📁 What’s Tested
Core logic and utility functions
Edge cases and invalid inputs
Asynchronous function behavior
Error and exception handling
🛠️ Tools Used
Jest
Node.js environment
📁 Test File Structure
/__tests__/
/utils/
  └── function.test.js
