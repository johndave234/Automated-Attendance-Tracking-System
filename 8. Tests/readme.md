# 📊 Automated Attendance Tracking System

## 🌟 Overview
A web-based system for managing university attendance through barcode scanning and RESTful APIs, featuring role-based access control and multi-factor authentication.

## 🛠️ Features
- 👨‍🏫 Instructor attendance recording via QR codes
- 👨‍🎓 Student attendance tracking
- 📊 Automated report generation
- 🔐 Secure authentication (MFA + RBAC)

## 🔍 Testing Documentation

### 🧪 Unit Testing (Jest)
![Jest Testing](media/image1.png)  
Frontend component testing coverage:
- 🖥️ 95% UI components
- 🔄 State management
- ❌ Error handling

### 📲 Attendance Scanning Tests
![Scanning Test](media/image2.png)  
Validation process:
1. 💾 Database pre-scan state
2. 📷 QR code scanning interface
3. ✔️ Post-scan verification

### 📮 API Testing (Postman)
![Postman Tests](media/image1.png)  
Verified endpoints:
- `/api/register/student` (POST)
- `/api/attendance/scan` (POST) 
- `/api/reports/attendance` (GET)

## 📊 Test Results
| Test Type       | Coverage | Status  |
|-----------------|----------|---------|
| Unit Tests      | 95%      | ✅ Pass |
| API Tests       | 100%     | ✅ Pass | 
| Security Tests  | 100%     | ✅ Pass |

## 🛡️ Quality Assurance
- 🔒 End-to-end encryption
- ⚡ <500ms API response time
- 📱 Cross-device compatibility

## 📚 Documentation
- [High-Level Design](Automated-Attendance-Tracking-System%20High-Level%20Design%20Document.docx)
- [Requirement Matrix](Requirement_Traceability_Matrix.xlsx)
- [Use Case Diagram](Use%20Case%20Diagram.docx)

## 📋 How to Test
1. Clone repository
2. Install dependencies: `npm install`
3. Run Jest tests: `npm test`
4. Import Postman collection for API tests
