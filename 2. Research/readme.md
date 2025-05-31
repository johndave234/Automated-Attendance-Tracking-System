# Project X - Research and Implementation Notes

This README provides a high-level overview and research-based implementation strategies for Project X, including testing strategies, design documentation, and feature-specific testing approaches.

---

## 📌 Unit Testing & Test-Driven Development (TDD)

- **Testing Framework**: Uses **Jest** (default in Expo) for unit testing.
- **Component-Level Testing**: Utilize **React Native Testing Library (RNTL)**.
- **Extended Matchers**: Use `@testing-library/jest-native` for improved test assertions.
- **TDD Workflow**:
  1. Write tests **before** implementing the features.
  2. Develop features to pass the tests.
  3. Refactor the code while keeping tests green.

---

## 🧩 High-Level Design Document Includes

- **System Overview**: Brief description of the system's purpose and functionality.
- **Architecture Diagram**: Visual representation of system architecture.
- **Modules and Components**: Logical breakdown of major components.
- **Data Flow / ER Diagrams**: Illustrations of how data flows through the system.
- **Technology Stack**: List of frameworks, libraries, databases, etc.
- **Security Considerations**: Authentication, authorization, and data protection measures.

---

## 🔐 Database Connectivity Testing (Login/Logout Flow)

### ✅ Successful Login
- Input **valid credentials**.
- Connects to **MongoDB backend**.
- User status is marked as **"logged in"** in the database.

### ❌ Failed Login
- Input **invalid credentials** (e.g., wrong password, unregistered user).
- User status should reflect **"login failed"** in the database.

### 🔓 Logout
- Perform logout operation.
- User status is updated to **"logged out"** in the database.

---

## 📷 QR Code Scanning Functionality

- Simulate scanning using a **course QR image**.
- Scan using **another device** but within the same system.
- User should be **marked present** in the system after successful scan.

---

## 📁 Tech Stack
- **Frontend**: React Native (Expo)
- **Testing**: Jest, RNTL, @testing-library/jest-native
- **Backend**: MongoDB

---

## 👨‍💻 Contributors

- *You may list team members here*

---

## 📄 License

This project is licensed under the MIT License.

---


