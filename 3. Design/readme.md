# 🚀 Automated Attendance Tracking System

## 🌟 Overview
A web-based application designed to streamline attendance management for universities through barcode scanning and automated reporting. Features role-based access control (RBAC), multi-factor authentication (MFA), and secure cloud deployment.

## ✨ Key Features
| Feature | Description |
|---------|-------------|
| 👥 **User Management** | Register/manage students, instructors, and admins with RBAC |
| 📊 **Attendance Tracking** | Record attendance via barcode scanning on registered devices |
| 📈 **Reporting** | Generate detailed attendance reports for courses/students |
| 🔐 **Security** | MFA for instructors, data encryption, and secure APIs |
| ☁️ **Cloud Deployment** | Auto-scaling cloud infrastructure |

## 🏗️ System Architecture
### 🖥️ Frontend
![Frontend Architecture](media/image1.png)
- **Technology**: Expo.js (SPA)
- **Components**:
  - � Instructor scanning interface
  - 🎓 Student attendance portal
  - 👔 Admin management dashboard

### ⚙️ Backend
![Backend Flow](media/image2.png)
- **Technology**: Spring Boot REST API
- **Functionality**:
  - 🔑 RBAC and MFA implementation
  - 📅 Attendance processing logic
  - 📝 Report generation

### 🗃️ Database
![Database Schema](media/image3.png)
- **Technology**: MySQL/MongoDB Atlas
- **Tables**:
  - `users` (credentials & roles)
  - `students` (profiles & photos)
  - `attendance_logs` (timestamps)
  - `devices` (registered devices)

## 🔗 API Endpoints
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/register/student` | POST | Register student | 🔑 Auth User |
| `/api/attendance/scan` | POST | Submit barcode scan | 👨‍🏫 Instructor |
| `/api/reports/attendance` | GET | Generate reports | 👔 Admin |

## 🔒 Security Features
- 🛡️ **RBAC**: Admin/Instructor/Student roles
- 🔐 **MFA**: Required for instructors
- 🔏 **Encryption**: Sensitive data protection
- 🔒 **TLS**: HTTPS with SSL

## 🛠️ Technology Stack
| Layer | Technologies |
|-------|-------------|
| Frontend | Expo.js |
| Backend | Spring Boot |
| Database | MySQL/MongoDB Atlas |
| Auth | Spring Security + MFA |
| Cloud | AWS/Azure/GCP |

## 🔄 System Workflow
1. **Registration** 👥 → DB 📀
2. **Attendance** 📷 → ✅ → DB 📊
3. **Viewing** 👀 → 📅
4. **Reporting** 📈 → 📁

## ⚠️ Constraints
- 📱 Requires camera-enabled devices
- 🖥️ Manual web dashboard registration
- 🚫 No university API integration (R05.03)

## 📅 Timeline
- 🧪 **System Check**: May 15, 2025
- 🚀 **Full Deployment**: May 22, 2025

## 📚 Documentation
- [📋 Requirement Matrix](Requirement_Traceability_Matrix.xlsx)
- [📊 Use Case Diagram](Use%20Case%20Diagram.docx)
- [📄 High-Level Design](Automated-Attendance-Tracking-System%20High-Level%20Design%20Document.docx)
