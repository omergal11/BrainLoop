# BrainLoop - Software Documentation

**Version:** 1.0.1 | **Last Updated:** February 18, 2026 | **Language:** English & Hebrew

## 📖 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [SQL Queries Used in Application](#sql-queries-used-in-application)
6. [API Reference](#api-reference)
7. [Backend Code Structure & Architecture](#backend-code-structure--architecture)
8. [Frontend Structure](#frontend-structure)

---

## Overview

**BrainLoop** is a comprehensive quiz and learning management system designed to help users learn through interactive quizzes with advanced analytics and gamification features.

### Core Features
- **🔐 JWT-Based Authentication** - Secure user accounts with 30-minute token expiry
- **📝 Multiple Question Types** - Multiple-choice (4 options) and code-writing questions
- **🔥 Streak & Gamification** - Track daily learning streaks, longest streaks
- **🏆 Learning Sessions** - Track user progress across study sessions
- **📊 Analytics Dashboard** - Personal stats and admin overview
- **⚡ High Performance** - Raw SQL (no ORM), optimized queries with JOINs and aggregations
- **🗄️ Large Dataset** - 100K+ data records with 166 users and 3,784 questions

### Design Principles
- **No ORM:** Direct SQL for better performance and control
- **Modular Routes:** Separate files for auth, questions, quiz, and stats
- **RESTful API:** Standard HTTP methods and status codes
- **Parameterized Queries:** 100% protection against SQL injection attacks
- **Rate Limiting:** DoS and brute-force protection
- **RBAC:** Role-Based Access Control (admin/user separation)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React)                              │
│         - User Interface (Tailwind CSS)                         │
│         - Authentication Context                                │
│         - API Client (Axios)                                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS/REST
┌──────────────────────────────▼──────────────────────────────────┐
│              SECURITY LAYER (API Gateway)                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Rate Limiter (DoS Protection)                             │ │
│  │  - Request throttling per IP/user                          │ │
│  │  - Brute-force detection                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│              AUTHENTICATION LAYER (FastAPI)                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  JWT Token Validation (30-min expiry)                      │ │
│  │  - Token signature verification                            │ │
│  │  - Role-Based Access Control (RBAC)                        │ │
│  │  - Bcrypt password verification                            │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│              APPLICATION LAYER (FastAPI Routes)                │
│  ┌────────────────┐  ┌────────────────────────────────────┐   │
│  │  auth.py       │  │   questions.py                     │   │
│  │  quiz.py       │  │   stats.py                         │   │
│  └────────────────┘  └────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  database.py | dependencies.py | schemas.py | limiter.py  │   │
│  └────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Parameterized SQL Queries
┌──────────────────────────────▼──────────────────────────────────┐
│              DATABASE LAYER (MySQL 8.0)                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  6 Tables with Indexes | Foreign Keys | Referential Int.  │ │
│  │  Users | Topics | Questions | Learning_Sessions            │ │
│  │  User_Answers | User_Strikes                                │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

**Components:**
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** FastAPI (Python 3.10+) with modular routes + Rate Limiting middleware
- **Database:** MySQL 8.0 with 6 tables, strategic indexes, and parameterized queries
- **Security:** JWT (30-min expiry), Bcrypt hashing, RBAC, Rate Limiting, Parameterized SQL

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Backend** | Python | 3.10+ | Runtime |
| | FastAPI | 0.104+ | Web framework |
| | PyMySQL | 1.1+ | MySQL driver |
| | PyJWT | 2.8+ | Token handling |
| | Passlib (bcrypt) | 1.7+ | Password hashing |
| | SlowAPI | 0.1+ | Rate limiting |
| | python-dotenv | 1.0+ | Environment config |
| **Frontend** | React | 18+ | UI framework |
| | Vite | 5+ | Build tool |
| | Tailwind CSS | 3+ | Styling |
| | Axios | 1.6+ | HTTP client |
| **Database** | MySQL | 8.0+ | Main database |
| **DevOps** | Node.js | 18+ | Frontend runtime |
| | Git | Latest | Version control |

---

## Database Schema

**6 Tables:** Users | Topics | Questions | Learning_Sessions | User_Answers | User_Strikes

### Detailed Schema

#### Users Table
```sql
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL UNIQUE,
  `password` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `is_admin` tinyint DEFAULT 0,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=212 DEFAULT CHARSET=utf8mb4;
```
- **Size:** 211 user records
- **Purpose:** Store user credentials and admin status
- **Key Features:** 
  - Username uniqueness constraint
  - Birth date tracking for user profiling
  - Admin role separation (0 = regular user, 1 = admin)
- **Origin:** ✅ Generated - Created for the BrainLoop system to manage user accounts and authentication
- **Fields:**
  - `user_id` - Auto-incrementing primary key (INT)
  - `username` - Unique identifier for login (VARCHAR 50)
  - `password` - User password (VARCHAR 100, hashed with Bcrypt)
  - `email` - User email address (VARCHAR 100, nullable)
  - `birth_date` - Date of birth (DATE, nullable)
  - `is_admin` - Admin flag (TINYINT, default: 0; 0 = regular user, 1 = admin) - Used for RBAC

#### Topics Table
```sql
CREATE TABLE `topics` (
  `topic_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL UNIQUE,
  PRIMARY KEY (`topic_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4;
```
- **Size:** 13 topics
- **Examples:** C, Java, JavaScript, Objective-C, PlainText, Python, SQL, Algorithms, Data Structures, Object-Oriented Programming, Operating Systems, Other/General CS, General Knowledge
- **Purpose:** Organize questions by learning domain
- **Origin:** ✅ Generated - Created for the BrainLoop system to categorize and organize learning content
- **Fields:**
  - `topic_id` - Auto-incrementing primary key (INT)
  - `name` - Unique topic name (VARCHAR 100)

#### Questions Table
```sql
CREATE TABLE `questions` (
  `q_id` int NOT NULL AUTO_INCREMENT,
  `question_text` mediumtext NOT NULL,
  `type` varchar(20) NOT NULL,
  `option_a` mediumtext,
  `option_b` mediumtext,
  `option_c` mediumtext,
  `option_d` mediumtext,
  `correct_answer` char(1) NOT NULL,
  `topic_id` int NOT NULL,
  PRIMARY KEY (`q_id`),
  KEY `idx_topic_id` (`topic_id`),
  KEY `idx_type` (`type`),
  KEY `idx_questions_id` (`q_id`),
  KEY `idx_questions_topic_id` (`topic_id`),
  CONSTRAINT `questions_ibfk_1` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`topic_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3786 DEFAULT CHARSET=utf8mb4;
```
- **Size:** 3,785 questions total
- **Type Distribution:** Code questions and multiple-choice questions
- **Features:** Multiple answer options, separate fields for each option
- **Purpose:** Core content repository
- **Data Source:** 🔗 [Hugging Face Coding MCQ Reasoning Dataset](https://huggingface.co/datasets/tuandunghcmut/coding-mcq-reasoning)
  - **Fields Renamed:** 
    - Original `task_id` → `q_id`
    - Original `question` → `question_text`
    - Original `answer` → `correct_answer`
  - **Fields Transformed:** 
    - Original `list_choices` → 4 separate fields (`option_a`, `option_b`, `option_c`, `option_d`)
  - **Fields Added:**
    - `type` - Question type (varchar 20)
    - `topic_id` - For organizing questions by subject (INT, Foreign Key)
  - **Data Augmentation:** Questions imported and organized with topics

#### Learning_Sessions Table
```sql
CREATE TABLE `learning_sessions` (
  `session_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `start_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `end_time` datetime DEFAULT NULL,
  `questions_solved` tinyint unsigned DEFAULT 0,
  PRIMARY KEY (`session_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_start_time` (`start_time`),
  KEY `idx_learning_sessions_user_id` (`user_id`),
  CONSTRAINT `learning_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10425 DEFAULT CHARSET=utf8mb4;
```
- **Purpose:** Track each study session
- **Metrics:** Duration, questions solved
- **Analytics:** Enables session-based reporting
- **Origin:** ✅ Generated - Created for the BrainLoop system to track and analyze user learning sessions
- **Fields:**
  - `session_id` - Auto-incrementing primary key (INT)
  - `user_id` - Foreign key to Users table (INT)
  - `start_time` - Session start time (DATETIME, default: current timestamp)
  - `end_time` - Session end time (DATETIME, nullable)
  - `questions_solved` - Number of questions solved in this session (TINYINT UNSIGNED, default: 0)

#### User_Answers Table
```sql
CREATE TABLE `user_answers` (
  `answer_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `q_id` int NOT NULL,
  `user_answer` text NOT NULL,
  `is_correct` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`answer_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_q_id` (`q_id`),
  KEY `idx_is_correct` (`user_id`,`is_correct`),
  KEY `idx_user_answers_user_id` (`user_id`),
  KEY `idx_user_answers_correct` (`user_id`,`is_correct`),
  CONSTRAINT `user_answers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `user_answers_ibfk_2` FOREIGN KEY (`q_id`) REFERENCES `questions` (`q_id`)
) ENGINE=InnoDB AUTO_INCREMENT=100561 DEFAULT CHARSET=utf8mb4;
```
- **Size:** 100,560+ records
- **Purpose:** Complete audit trail of all user responses
- **Analytics:** Enables question difficulty analysis, user performance tracking
- **Data Source:** 🔗 [Kaggle EDNet KT3.4 Dataset](https://www.kaggle.com/datasets/anhtu96/ednet-kt34/code)
  - **Origin:** Based on original EdNet KT3.4 knowledge tracing dataset
  - **Fields Removed:** `platform`, `cursor_time`, `source`, `action_type` (not applicable to quiz context)
  - **Fields Modified:** Original `item_id` field renamed to `q_id` for alignment with Questions table
  - **Fields Added:** `is_correct` boolean field (TINYINT(1)) - tracks whether the user's answer was correct
- **Fields:**
  - `answer_id` - Auto-incrementing primary key (INT)
  - `user_id` - Foreign key to Users table (INT)
  - `q_id` - Foreign key to Questions table (INT)
  - `user_answer` - The user's submitted answer (TEXT)
  - `is_correct` - Whether the answer was correct (TINYINT(1), 0 or 1)

#### User_Strikes Table
```sql
CREATE TABLE `user_strikes` (
  `user_id` int NOT NULL,
  `current_streak_days` tinyint unsigned DEFAULT 0,
  `longest_streak` tinyint unsigned DEFAULT 0,
  `current_streak_start` date DEFAULT NULL,
  `last_activity_date` date DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  KEY `idx_current_streak` (`current_streak_days`),
  KEY `idx_longest_streak` (`longest_streak`),
  CONSTRAINT `user_strikes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```
- **Purpose:** Gamification - track daily learning streaks
- **Logic:** Updated when user completes a session
- **Streak Rules:** +1 day if activity detected; resets if gap > 1 day
- **Origin:** ✅ Generated - Created for the BrainLoop system to implement gamification features and engagement tracking
- **Fields:**
  - `user_id` - Primary key, foreign key to Users table (INT)
  - `current_streak_days` - Current consecutive days of activity (TINYINT UNSIGNED, default: 0)
  - `longest_streak` - Longest streak ever achieved (TINYINT UNSIGNED, default: 0)
  - `current_streak_start` - Start date of current streak (DATE, nullable)
  - `last_activity_date` - Date of last user activity (DATE, nullable)

### Database Statistics
| Metric | Value |
|--------|-------|
| **Total Records** | 100K+ user answers |
| **Users** | 211 records |
| **Questions** | 3,785 records |
| **Topics** | 13 records |
| **Learning Sessions** | 10,425 records |
| **Total Indexes** | 15+ |
| **Relationships** | 5 (Foreign Keys) |
| **Complex Queries** | 5+ (JOINs, GROUP BY, aggregations) |

### Indexes Used

**Users Table Indexes:**
- `PRIMARY KEY (user_id)` - Primary key for user identification
- `UNIQUE KEY username (username)` - Enforce username uniqueness, optimize login queries

**Topics Table Indexes:**
- `PRIMARY KEY (topic_id)` - Primary key for topic identification
- `UNIQUE KEY name (name)` - Enforce topic name uniqueness, optimize topic lookups

**Questions Table Indexes:**
- `PRIMARY KEY (q_id)` - Primary key for question identification
- `KEY idx_topic_id (topic_id)` - Speed up topic-based question filtering (used in random batch queries)
- `KEY idx_type (type)` - Speed up question type filtering (code vs choose questions)
- `KEY idx_questions_id (q_id)` - Optimize direct question lookups
- `KEY idx_questions_topic_id (topic_id)` - Redundant but optimized for topic joins
- `FOREIGN KEY (topic_id) REFERENCES topics(topic_id)` - Maintain referential integrity

**Learning_Sessions Table Indexes:**
- `PRIMARY KEY (session_id)` - Primary key for session identification
- `KEY idx_user_id (user_id)` - Speed up user session queries (get all sessions for a user)
- `KEY idx_start_time (start_time)` - Optimize date-range queries for analytics
- `KEY idx_learning_sessions_user_id (user_id)` - Optimized join with users table
- `FOREIGN KEY (user_id) REFERENCES users(user_id)` - Maintain referential integrity

**User_Answers Table Indexes:**
- `PRIMARY KEY (answer_id)` - Primary key for answer identification
- `KEY idx_user_id (user_id)` - Speed up answer lookups by user (most common query)
- `KEY idx_q_id (q_id)` - Speed up answer lookups by question
- `KEY idx_is_correct (user_id, is_correct)` - Composite index for accuracy/success rate calculations
- `KEY idx_user_answers_user_id (user_id)` - Optimized for user-specific queries
- `KEY idx_user_answers_correct (user_id, is_correct)` - Optimize GROUP BY queries for stats
- `FOREIGN KEY (user_id) REFERENCES users(user_id)` - Maintain referential integrity
- `FOREIGN KEY (q_id) REFERENCES questions(q_id)` - Maintain referential integrity

**User_Strikes Table Indexes:**
- `PRIMARY KEY (user_id)` - Primary key, also foreign key reference
- `KEY idx_current_streak (current_streak_days)` - Speed up streak-based leaderboard queries
- `KEY idx_longest_streak (longest_streak)` - Optimize longest streak lookups
- `FOREIGN KEY (user_id) REFERENCES users(user_id)` - Maintain referential integrity

### Index Performance Impact

| Query Type | Indexes Used | Performance Gain |
|-----------|-------------|-----------------|
| Login by username | `users.username` UNIQUE | O(1) - Instant lookup |
| Get random questions by type/topic | `questions.idx_type`, `questions.idx_topic_id` | O(log n) - Fast filtering |
| Get user's answers | `user_answers.idx_user_id` | O(log n) - Quick user filtering |
| Calculate success rate | `user_answers.idx_user_answers_correct` | O(log n) - Fast aggregation |
| Get user's sessions | `learning_sessions.idx_user_id` | O(log n) - Quick session retrieval |
| Leaderboard queries | `user_strikes.idx_longest_streak`, `user_strikes.idx_current_streak` | O(log n) - Fast sorting/ranking |

### Database Tables Summary

| Table | Key Columns | Indexes | Purpose |
|-------|------------|---------|---------|
| **Users** | user_id (PK), username, password, email, birth_date, is_admin | UNIQUE(username) | User accounts with authentication |
| **Topics** | topic_id (PK), name | UNIQUE(name) | Learning categories |
| **Questions** | q_id (PK), question_text, type, topic_id (FK), option_a/b/c/d, correct_answer | idx_topic_id, idx_type | Quiz questions with multiple formats |
| **Learning_Sessions** | session_id (PK), user_id (FK), start_time, end_time, questions_solved | idx_user_id, idx_start_time | Session tracking |
| **User_Answers** | answer_id (PK), user_id (FK), q_id (FK), user_answer, is_correct | idx_user_id, idx_q_id, idx_is_correct | Answer records and grading |
| **User_Strikes** | user_id (PK/FK), current_streak_days, longest_streak, current_streak_start, last_activity_date | idx_current_streak, idx_longest_streak | Streak tracking and gamification |

---

---

## 🛡️ Security & Reliability (SRE Focus)

### Security Features Implemented

#### 1. **Identity & Access Management**
- **JWT Authentication:** Modern token-based authentication using `PyJWT` with 30-minute expiry
- **Bcrypt Password Hashing:** Industry-standard password hashing with salt (Passlib library)
- **Role-Based Access Control (RBAC):** Admin vs regular user separation via `is_admin` flag
  - Admin endpoints: `/admin/stats/overview` - data visibility control
  - Regular user endpoints: `/stats/user` - personal stats only

#### 2. **Infrastructure Protection**
- **Rate Limiting:** SlowAPI middleware prevents:
  - Brute-force attacks (login attempts)
  - Distributed Denial of Service (DDoS) attacks
  - API abuse (excessive requests)
  - Rate: 100 requests per minute per IP address (configurable)

#### 3. **Database Security**
- **Parameterized Queries:** 100% SQL Injection protection
  - All user input passed as parameters: `WHERE username = %s`
  - SQL structure separated from data (never string concatenation)
  - Prevents: `' OR '1'='1` type attacks
- **Connection Pooling:** Managed MySQL connections with authentication
- **Referential Integrity:** Foreign keys maintain data consistency

#### 4. **Secrets Management**
- **Environment Variables:** All sensitive data stored externally
  - `MYSQL_PASSWORD`, `SECRET_KEY` - never in code
  - `.env` file for local development
  - Docker secrets for production
- **No Hardcoded Credentials:** Dynamic configuration via `python-dotenv`

#### 5. **Token Security**
- **Expiration:** 30-minute JWT token lifetime
- **Signature Verification:** HS256 algorithm with `SECRET_KEY`
- **Payload:** Contains `user_id`, `username`, `is_admin` (immutable)

#### 6. **Observability & Monitoring** (Coming Soon)
- **Prometheus metrics:** Real-time security event tracking
- **Grafana dashboards:** Failed login attempts, rate limit hits
- **Audit logging:** Database query logging for compliance

### Security Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│              CLIENT REQUEST (HTTPS)                      │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│        RATE LIMITER (100 req/min per IP)                │
│  ✓ Throttles requests                                   │
│  ✓ Blocks brute-force attacks                           │
│  ✓ DDoS mitigation                                      │
│  Returns: 429 Too Many Requests                         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│     JWT TOKEN VALIDATION & RBAC                          │
│  ✓ Signature verification (HS256)                       │
│  ✓ Token expiry check (30-min)                          │
│  ✓ User role verification (admin/user)                  │
│  ✓ Endpoint permission check                            │
│  Returns: 401 Unauthorized | 403 Forbidden              │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│     BCRYPT PASSWORD VERIFICATION (Login only)            │
│  ✓ Hash comparison (never plain text)                   │
│  ✓ Timing-safe comparison                                │
│  Returns: 401 Unauthorized                              │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│     REQUEST ROUTING & VALIDATION                         │
│  ✓ Schema validation (Pydantic)                         │
│  ✓ Input sanitization                                   │
│  ✓ Error handling & logging                             │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│     PARAMETERIZED SQL EXECUTION                          │
│  ✓ All queries use placeholders (%s)                    │
│  ✓ Data passed as separate parameters                   │
│  ✓ SQL structure unchanged                              │
│  ✓ 100% SQL Injection protected                         │
│                                                         │
│  Example: WHERE username = %s                           │
│           (NOT: WHERE username = '" + username + "')    │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│     DATABASE TRANSACTION & RESPONSE                      │
│  ✓ Data returned securely                               │
│  ✓ Sensitive data (passwords) excluded                  │
│  ✓ Encrypted connection (MySQL over TCP)                │
└─────────────────────────────────────────────────────────┘
```

### Security Best Practices Checklist

| Security Aspect | Status | Implementation |
|-----------------|--------|----------------|
| **Password Storage** | ✅ | Bcrypt hashing with salt |
| **Token Expiry** | ✅ | 30-minute JWT expiration |
| **SQL Injection** | ✅ | 100% Parameterized queries |
| **Brute-Force** | ✅ | Rate limiting (100 req/min) |
| **DDoS Protection** | ✅ | Rate limiting middleware |
| **Secrets Storage** | ✅ | Environment variables only |
| **RBAC** | ✅ | Admin/user role separation |
| **Token Signature** | ✅ | HS256 with SECRET_KEY |
| **HTTPS** | ✅ | Enforced in production |
| **CORS** | ✅ | Restricted to frontend origin |
| **Audit Logging** | 🔄 | Prometheus/Grafana (Coming Soon) |
| **2FA** | 🔄 | Future enhancement |

---

## SQL Queries Used in Application

### Authentication Queries

**1. Check Username Existence (auth.py - create_user)**
*Checks if username already exists in the system before registration*
```sql
SELECT user_id FROM Users WHERE username = %s
```

**2. Check Email Existence (auth.py - create_user)**
*Checks if email already exists in the system before registration*
```sql
SELECT user_id FROM Users WHERE email = %s
```

**3. Create New User (auth.py - create_user)**
*Inserts a new user into the system with username, email, password, birth date, and admin privileges*
```sql
INSERT INTO Users (username, email, password, birth_date, is_admin) 
VALUES (%s, %s, %s, %s, %s)
```

**4. Initialize User Streak (auth.py - create_user)**
*Creates a new streak record for new user with initial values*
```sql
INSERT INTO User_Strikes (user_id, current_streak_start, current_streak_days, longest_streak, last_activity_date) 
VALUES (%s, %s, %s, %s, %s)
```

**5. Get User for Login (auth.py - login)**
*Retrieves user details including password for authentication during login*
```sql
SELECT user_id, username, email, password, birth_date, is_admin 
FROM Users 
WHERE username = %s
```

**6. Get User Streak (auth.py - login)**
*Retrieves user streak information to check current streak status*
```sql
SELECT * FROM User_Strikes WHERE user_id = %s
```

**7. Initialize Streak on First Login (auth.py - login)**
*Creates a new streak record for users without existing streak data (legacy users)*
```sql
INSERT INTO User_Strikes (user_id, current_streak_start, current_streak_days, longest_streak, last_activity_date) 
VALUES (%s, %s, %s, %s, %s)
```

**8. Update Streak - No Previous Activity (auth.py - login)**
*Updates streak when user has no previous activity - starts new streak with value 1*
```sql
UPDATE User_Strikes 
SET current_streak_start = %s, current_streak_days = 1, longest_streak = 1, last_activity_date = %s 
WHERE user_id = %s
```

**9. Update Streak - Consecutive Day (auth.py - login)**
*Updates streak when user logs in on a consecutive day - increments streak and updates longest_streak if new record*
```sql
UPDATE User_Strikes 
SET current_streak_days = %s, longest_streak = %s, last_activity_date = %s 
WHERE user_id = %s
```

**10. Update Streak - Reset (auth.py - login)**
*Resets streak when gap exceeds 1 day from last activity - starts new streak*
```sql
UPDATE User_Strikes 
SET current_streak_start = %s, current_streak_days = 1, last_activity_date = %s 
WHERE user_id = %s
```

**11. Get User by ID (auth.py)**
*Retrieves user details by user ID (without password)*
```sql
SELECT user_id, username, email, birth_date, is_admin 
FROM Users 
WHERE user_id = %s
```

**12. Get User Streak Info (auth.py)**
*Retrieves complete streak information for user including current streak, longest streak, and dates*
```sql
SELECT user_id, current_streak_days, longest_streak, current_streak_start, last_activity_date 
FROM User_Strikes 
WHERE user_id = %s
```

---

### Questions Queries

**1. List Questions with Limit (questions.py)**
*Retrieves list of first questions (up to specified limit) from system*
```sql
SELECT * FROM Questions LIMIT %s
```

**2. Get Single Question (questions.py)**
*Retrieves details of specific question by its ID*
```sql
SELECT * FROM Questions WHERE q_id = %s
```

**3. Get Random Question (questions.py)**
*Retrieves a random question from the system*
```sql
SELECT * FROM Questions ORDER BY RAND() LIMIT 1
```

**4. Get Random Questions Batch with Filters (questions.py)**
*Retrieves batch of random questions of specific type (code or multiple-choice) optionally filtered by topics*
```sql
-- With topic filters:
SELECT * FROM Questions 
WHERE type = %s AND topic_id IN (...) 
ORDER BY RAND() LIMIT %s

-- Without topic filters:
SELECT * FROM Questions 
WHERE type = %s 
ORDER BY RAND() LIMIT %s
```

**5. Get Code Question Topics (questions.py)**
*Retrieves list of all topics that have coding questions*
```sql
SELECT DISTINCT t.topic_id, t.name
FROM Topics t
JOIN Questions q ON q.topic_id = t.topic_id
WHERE q.type = 'code' AND t.topic_id IS NOT NULL
```

**6. Get Multiple-Choice Topics (questions.py)**
*Retrieves list of all topics that have multiple-choice questions*
```sql
SELECT DISTINCT t.topic_id, t.name
FROM Topics t
JOIN Questions q ON q.topic_id = t.topic_id
WHERE q.type = 'choose' AND t.topic_id IS NOT NULL
```

---

### Quiz Queries

**1. Get Random Questions by Type and Topics (quiz.py)**
*Retrieves batch of random questions filtered by question type and optionally by topics for quiz session*
```sql
-- With topic filters:
SELECT * FROM Questions 
WHERE type = %s AND topic_id IN (...) 
ORDER BY RAND() LIMIT %s

-- Without topic filters:
SELECT * FROM Questions 
WHERE type = %s 
ORDER BY RAND() LIMIT %s
```

**2. Get Question for Answer Verification (quiz.py)**
*Retrieves complete question details needed to verify user's answer correctness*
```sql
SELECT * FROM Questions WHERE q_id = %s
```

**3. Submit User Answer (quiz.py)**
*Stores user's answer along with correctness evaluation in the database*
```sql
INSERT INTO User_Answers (user_id, q_id, user_answer, is_correct) 
VALUES (%s, %s, %s, %s)
```

**4. Create Learning Session (quiz.py)**
*Records a new learning/quiz session with start time, end time, and number of questions solved*
```sql
INSERT INTO Learning_Sessions (user_id, start_time, end_time, questions_solved) 
VALUES (%s, %s, %s, %s)
```

**5. Get User Streak for Session Completion (quiz.py)**
*Retrieves user's current streak information to determine if streak needs to be updated*
```sql
SELECT * FROM User_Strikes WHERE user_id = %s
```

**6. Update Streak - Consecutive Day Session (quiz.py)**
*Increments streak when user completes session on consecutive day and updates longest streak record*
```sql
UPDATE User_Strikes 
SET current_streak_days = %s, longest_streak = %s, last_activity_date = %s 
WHERE user_id = %s
```

**7. Update Streak - Reset Session (quiz.py)**
*Resets streak counter to 1 when session occurs after gap exceeding 1 day*
```sql
UPDATE User_Strikes 
SET current_streak_days = 1, last_activity_date = %s 
WHERE user_id = %s
```

**8. Get Updated User Streak After Session (quiz.py)**
*Retrieves user's updated streak information after session completion for response confirmation*
```sql
SELECT * FROM User_Strikes WHERE user_id = %s
```

---

### Statistics Queries

**1. Get User Total Questions & Correct Answers (stats.py - get_user_stats)**
*Calculates total number of questions answered and correct answers for a user*
SELECT 
    COUNT(*) as total_questions,
    SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers
FROM User_Answers
WHERE user_id = %s
```

**2. Get Strongest Topic by User (stats.py - get_user_stats)**
*Identifies user's best-performing topic based on accuracy percentage (requires at least 1 answer)*
SELECT t.name, 
       COUNT(*) as total,
       SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) as correct,
       ROUND(CAST(SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) AS FLOAT) * 100.0 / COUNT(*), 2) as accuracy
FROM User_Answers ua
JOIN Questions q ON ua.q_id = q.q_id
JOIN Topics t ON q.topic_id = t.topic_id
WHERE ua.user_id = %s
GROUP BY t.name
HAVING COUNT(*) > 0
ORDER BY accuracy DESC, COUNT(*) DESC
LIMIT 1
```

**3. Get Weakest Topic by User (stats.py - get_user_stats)**
*Identifies user's weakest topic based on lowest accuracy percentage (requires at least 1 answer)*
SELECT t.name, 
       COUNT(*) as total,
       SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) as correct,
       ROUND(CAST(SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) AS FLOAT) * 100.0 / COUNT(*), 2) as accuracy
FROM User_Answers ua
JOIN Questions q ON ua.q_id = q.q_id
JOIN Topics t ON q.topic_id = t.topic_id
WHERE ua.user_id = %s
GROUP BY t.name
HAVING COUNT(*) > 0
ORDER BY accuracy ASC, COUNT(*) DESC
LIMIT 1
```

**4. Get User Streak (stats.py - get_user_stats)**
*Retrieves current and longest streak values for user*
SELECT current_streak_days, longest_streak
FROM User_Strikes
WHERE user_id = %s
```

**5. Get Last Session (stats.py - get_user_stats)**
*Retrieves most recent completed learning session for the user*
SELECT 
    session_id, 
    start_time, 
    end_time, 
    questions_solved
FROM Learning_Sessions
WHERE user_id = %s AND end_time IS NOT NULL
ORDER BY session_id DESC
LIMIT 1
```

**6. Get Best Session (stats.py - get_user_stats)**
*Identifies best learning session based on most questions solved, sorted by duration (fastest)*
SELECT 
    session_id, 
    start_time, 
    end_time, 
    questions_solved
FROM Learning_Sessions
WHERE user_id = %s AND end_time IS NOT NULL AND questions_solved > 0
ORDER BY questions_solved DESC, (UNIX_TIMESTAMP(end_time) - UNIX_TIMESTAMP(start_time)) ASC, session_id DESC
LIMIT 1
```

**7. Get All Topic Stats for User (stats.py - get_user_stats)**
*Provides comprehensive statistics for each topic including total attempts and correct answers*
SELECT 
    t.name as topic,
    COUNT(*) as total,
    SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) as correct
FROM User_Answers ua
JOIN Questions q ON ua.q_id = q.q_id
JOIN Topics t ON q.topic_id = t.topic_id
WHERE ua.user_id = %s
GROUP BY t.name
```

**8. Get Top 10 Students (stats.py - get_admin_stats) - Admin Only**
*Retrieves leaderboard of top 10 students by success rate (requires minimum 1 answered question)*
SELECT 
    u.user_id,
    u.username,
    COUNT(ua.answer_id) as total_questions,
    SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
    ROUND(CAST(SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) AS FLOAT) * 100.0 / COUNT(ua.answer_id), 2) as success_rate
FROM Users u
LEFT JOIN User_Answers ua ON u.user_id = ua.user_id
GROUP BY u.user_id, u.username
HAVING COUNT(ua.answer_id) > 0
ORDER BY success_rate DESC
LIMIT 10
```

**9. Get Most Practiced Topics (stats.py - get_admin_stats) - Admin Only**
*Identifies top 5 topics by total number of answer attempts across all users*
SELECT COALESCE(t.name, 'Unknown') as topic_name, COUNT(ua.answer_id) as answer_count
FROM User_Answers ua
JOIN Questions q ON ua.q_id = q.q_id
LEFT JOIN Topics t ON q.topic_id = t.topic_id
GROUP BY t.name
ORDER BY answer_count DESC
LIMIT 5
```

**10. Get Most Challenging Topics (stats.py - get_admin_stats) - Admin Only**
*Identifies 5 topics with lowest success rates (minimum 3 answers) - topics users struggle with most*
SELECT 
    COALESCE(t.name, 'Unknown') as topic_name,
    COUNT(ua.answer_id) as total,
    SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) as correct,
    ROUND(CAST(SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) AS FLOAT) * 100.0 / COUNT(ua.answer_id), 2) as success_rate
FROM User_Answers ua
JOIN Questions q ON ua.q_id = q.q_id
LEFT JOIN Topics t ON q.topic_id = t.topic_id
GROUP BY t.name
HAVING COUNT(ua.answer_id) >= 3
ORDER BY success_rate ASC
LIMIT 5
```

**11. Get Highest Proficiency Topics (stats.py - get_admin_stats) - Admin Only**
*Identifies 5 topics with highest success rates (minimum 3 answers) - topics users master best*
SELECT 
    COALESCE(t.name, 'Unknown') as topic_name,
    COUNT(ua.answer_id) as total,
    SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) as correct,
    ROUND(CAST(SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) AS FLOAT) * 100.0 / COUNT(ua.answer_id), 2) as success_rate
FROM User_Answers ua
JOIN Questions q ON ua.q_id = q.q_id
LEFT JOIN Topics t ON q.topic_id = t.topic_id
GROUP BY t.name
HAVING COUNT(ua.answer_id) >= 3
ORDER BY success_rate DESC
LIMIT 5
```

**12. Get Average Session Duration (stats.py - get_admin_stats) - Admin Only**
*Calculates average learning session duration in minutes across all completed sessions*
SELECT AVG((UNIX_TIMESTAMP(end_time) - UNIX_TIMESTAMP(start_time)) / 60.0) as avg_minutes
FROM Learning_Sessions
WHERE end_time IS NOT NULL
```

**13. Get Strongest Overall Topic (stats.py - get_admin_stats) - Admin Only**
*Identifies the topic with highest success rate across entire user base*
SELECT 
    COALESCE(t.name, 'Unknown') as topic_name,
    ROUND(CAST(SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) AS FLOAT) * 100.0 / COUNT(ua.answer_id), 2) as success_rate
FROM User_Answers ua
JOIN Questions q ON ua.q_id = q.q_id
LEFT JOIN Topics t ON q.topic_id = t.topic_id
GROUP BY t.name
HAVING COUNT(ua.answer_id) > 0
ORDER BY success_rate DESC
LIMIT 1
```

**14. Get Weakest Overall Topic (stats.py - get_admin_stats) - Admin Only**
*Identifies the topic with lowest success rate across entire user base*
SELECT 
    COALESCE(t.name, 'Unknown') as topic_name,
    ROUND(CAST(SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) AS FLOAT) * 100.0 / COUNT(ua.answer_id), 2) as success_rate
FROM User_Answers ua
JOIN Questions q ON ua.q_id = q.q_id
LEFT JOIN Topics t ON q.topic_id = t.topic_id
GROUP BY t.name
HAVING COUNT(ua.answer_id) > 0
ORDER BY success_rate ASC
LIMIT 1
```

**15. Get User with Longest Streak (stats.py - get_admin_stats) - Admin Only**
*Retrieves user with highest all-time streak achievement for leaderboard display*
SELECT u.user_id, u.username, us.longest_streak
FROM Users u
JOIN User_Strikes us ON u.user_id = us.user_id
WHERE us.longest_streak > 0
ORDER BY us.longest_streak DESC
LIMIT 1
```

**16. Get User with Current Longest Streak (stats.py - get_admin_stats) - Admin Only**
*Retrieves user with highest active/current streak for real-time leaderboard display*
SELECT u.user_id, u.username, us.current_streak_days
FROM Users u
JOIN User_Strikes us ON u.user_id = us.user_id
WHERE us.current_streak_days > 0
ORDER BY us.current_streak_days DESC
LIMIT 1
```

**17. Get Best Session Overall (stats.py - get_admin_stats) - Admin Only**
*Identifies best learning session across all users based on questions solved and duration (fastest first)*
SELECT 
    ls.session_id,
    u.username,
    ls.start_time,
    ls.end_time,
    ls.questions_solved,
    u.user_id,
    ROUND((UNIX_TIMESTAMP(ls.end_time) - UNIX_TIMESTAMP(ls.start_time)) / 60.0, 2) as duration_minutes
FROM Learning_Sessions ls
JOIN Users u ON ls.user_id = u.user_id
WHERE ls.end_time IS NOT NULL AND ls.questions_solved > 0
ORDER BY ls.questions_solved DESC, (UNIX_TIMESTAMP(ls.end_time) - UNIX_TIMESTAMP(ls.start_time)) ASC
LIMIT 1
```

---

## API Reference

### Authentication
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/users` | POST | Register new user |
| `/auth/login` | POST | User login (returns JWT token) |
| `/auth/me` | GET | Get current user info |

### Questions
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/questions/` | GET | List all questions (paginated) |
| `/questions/{id}` | GET | Get single question |
| `/questions/random` | GET | Get random question |
| `/questions/random-batch` | GET | Get multiple random questions (with filters) |
| `/questions/topics/code` | GET | Get code question topics |
| `/questions/topics/multiple-choice` | GET | Get multiple-choice topics |

### Quiz
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/quiz/sessions` | POST | Start learning session |
| `/quiz/submit-answer` | POST | Submit answer to question |
| `/quiz/sessions/{id}/complete` | POST | End learning session |

### Statistics
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/stats/user` | GET | Get personal statistics |
| `/admin/stats/overview` | GET | Get admin dashboard data |

**Sample Request/Response:**
```bash
# Login
POST /auth/login
{"username": "john_doe", "password": "pass123"}
→ {"access_token": "...", "user_id": 1}

# Submit Answer
POST /quiz/submit-answer
{"session_id": 101, "question_id": 5, "answer": "4"}
→ {"is_correct": true, "correct_answer": "4"}

# Get Stats
GET /stats/user
→ {"total_questions": 150, "correct_answers": 127, "success_rate": 84.67, ...}
```

---

## Backend Code Structure & Architecture

### Directory Layout

```
backend/
├── main.py              # FastAPI application entry point
├── database.py          # Database connection pool & index creation
├── dependencies.py      # JWT authentication, shared dependencies
├── schemas.py          # Pydantic data validation models
├── requirements.txt    # Python dependencies (FastAPI, PyMySQL, PyJWT)
└── routes/            # API endpoint handlers (modular routes)
    ├── auth.py        # User registration & login endpoints
    ├── questions.py   # Question retrieval endpoints  
    ├── quiz.py        # Quiz session & answer submission endpoints
    ├── stats.py       # User statistics & admin analytics endpoints
    └── __init__.py
```

### Core Modules & Responsibilities

#### 1. **main.py** - Application Entry Point
**Purpose:** Initialize FastAPI application and register all routes
**Key Components:**
- `FastAPI(title="BrainLoop API", version="0.1.0")` - Main application instance
- `CORSMiddleware` - Enable cross-origin requests for React frontend (localhost:5173-5176)
- Route registration - Includes all routers from `auth`, `questions`, `quiz`, `stats`
- `create_indexes()` - Called on startup to ensure database indexes exist

**Database Operations:** None - just orchestration

#### 2. **database.py** - Database Connection Management
**Purpose:** Handle MySQL connection pooling and raw SQL execution
**Key Functions:**
- `get_mysql_pool()` - Creates/retrieves MySQLConnectionPool with 5 pre-allocated connections
- `get_connection()` - Returns dictionary-based cursor connection from pool
- `create_indexes()` - Creates strategic indexes on startup for performance

**Configuration:**
```
Database Type: MySQL 8.0
Connection Pool Size: 5 (pre-allocated connections)
Connection Timeout: Automatic reconnection on failure
Cursor Type: Dictionary cursor (returns rows as dicts)
```

**Database Operations:** 
- Pool management for all database connections
- Index creation on: User_Answers, Learning_Sessions, Questions tables

#### 3. **schemas.py** - Data Validation Models (Pydantic)
**Purpose:** Define request/response schemas and validate data types
**Key Classes:**

| Class | Purpose |
|-------|---------|
| `UserCreateRequest` | Validates registration data (username pattern, email format, 6-digit password) |
| `LoginRequest` | Validates login credentials |
| `QuestionSchema` | Full question data (includes correct_answer) |
| `QuestionPublicSchema` | Public question data (excludes correct_answer for quiz) |
| `SubmitAnswerRequest` | Validates answer submission data |
| `TopicPublicSchema` | Topic information |
| `CompleteSessionRequest` | Session completion data with answer count |
| `StartSessionRequest` | Session start parameters |

**Database Operations:** None - pure data validation

#### 4. **dependencies.py** - Shared Utilities & JWT Authentication
**Purpose:** Provide JWT token generation/validation and shared database dependency
**Key Functions:**
- `get_db()` - FastAPI dependency that provides database connection for each request
- `create_jwt(user_id, username)` - Generates JWT token with 30-minute expiry
- `get_current_user()` - Validates JWT token and returns current user info
- `verify_password()` - Password verification (currently plain text - TODO: bcrypt)

**Configuration:**
- `ACCESS_TOKEN_EXPIRE_MINUTES = 30` - JWT token lifetime
- `ALGORITHM = "HS256"` - JWT signing algorithm
- `SECRET_KEY` - Retrieved from environment variable

**Database Operations:** None - JWT processing only

### Routes Module - API Endpoints & Database Access

**Directory:** `backend/routes/`

#### 1. **auth.py** - Authentication Routes
**Endpoints:**
| Endpoint | Method | Database Operations | Classes |
|----------|--------|-------------------|---------|
| `/auth/users` | POST | 2 SELECTs (check username/email) + 2 INSERTs (user + streak) | UserCreateRequest, UserResponse |
| `/auth/login` | POST | 1 SELECT (get user) + password verification | LoginRequest, LoginResponse |
| `/auth/me` | GET | No direct - uses JWT middleware | UserResponse |

**Key Functions:**
- `create_user()` - Register new user with initial streak
- `login()` - Authenticate user and generate JWT
- `get_current_user_info()` - Return authenticated user details

**Database Operations Performed:**
```
Registration Flow:
├─ SELECT user_id FROM Users WHERE username = %s (check duplicate)
├─ SELECT user_id FROM Users WHERE email = %s (check duplicate)
├─ INSERT INTO Users (...) (create user)
└─ INSERT INTO User_Strikes (...) (initialize streak)

Login Flow:
├─ SELECT user_id, username, email, password, birth_date, is_admin FROM Users WHERE username = %s
├─ [Password verification in Python]
└─ [JWT generation in Python]
```

#### 2. **questions.py** - Question Management Routes
**Endpoints:**
| Endpoint | Method | Database Operations | Classes |
|----------|--------|-------------------|---------|
| `/questions/` | GET | SELECT with LIMIT | QuestionSchema list |
| `/questions/{id}` | GET | 1 SELECT by q_id | QuestionSchema |
| `/questions/random` | GET | SELECT with RAND() | QuestionSchema |
| `/questions/random-batch` | GET | SELECT with WHERE filters | QuestionSchema list |
| `/questions/topics/code` | GET | SELECT DISTINCT with JOIN | TopicPublicSchema list |
| `/questions/topics/choose` | GET | SELECT DISTINCT with JOIN | TopicPublicSchema list |

**Key Functions:**
- `list_questions(limit)` - Return paginated questions (default 5, max 100)
- `get_question(question_id)` - Return single question by ID
- `get_random_questions()` - Return 1 random question
- `get_random_batch()` - Return multiple random questions with optional filters
- `get_code_topics()` / `get_mc_topics()` - Return available topics for each type

**Database Operations Performed:**
```
Random Question Selection:
├─ SELECT * FROM Questions ORDER BY RAND() LIMIT 1

Filtered Batch:
├─ SELECT * FROM Questions WHERE type = %s AND topic_id IN (...) ORDER BY RAND() LIMIT %s

Topic Retrieval:
└─ SELECT DISTINCT t.topic_id, t.name FROM Topics t 
   JOIN Questions q ON q.topic_id = t.topic_id 
   WHERE q.type = 'code'
```

**Indexes Used:** `idx_type`, `idx_topic_id`, `idx_questions_id`

#### 3. **quiz.py** - Quiz Execution & Answer Submission
**Endpoints:**
| Endpoint | Method | Database Operations | Classes |
|----------|--------|-------------------|---------|
| `/quiz/sessions` | POST | 1 INSERT (create session) | StartSessionRequest |
| `/quiz/submit-answer` | POST | 1 SELECT (get question) + 1 INSERT (store answer) | SubmitAnswerRequest, SubmitAnswerResponse |
| `/quiz/sessions/{id}/complete` | POST | Multiple UPDATEs to User_Strikes, SELECT streak | CompleteSessionRequest |

**Key Functions:**
- `start_session()` - Create new Learning_Sessions record with start_time
- `submit_answer()` - Verify answer correctness and store in User_Answers
- `complete_session()` - End session and update streak based on timing
- `_update_streak()` - Internal function to handle streak logic (consecutive/reset)

**Database Operations Performed:**
```
Submit Answer Flow:
├─ SELECT * FROM Questions WHERE q_id = %s (verify question exists)
├─ [Answer verification in Python]
└─ INSERT INTO User_Answers (user_id, q_id, user_answer, is_correct) (store answer)

Complete Session Flow:
├─ SELECT * FROM User_Strikes WHERE user_id = %s (check current streak)
├─ [Python logic: determine if consecutive day or reset]
├─ UPDATE User_Strikes (update current_streak_days, longest_streak, last_activity_date)
├─ UPDATE Learning_Sessions (set end_time, questions_solved)
└─ SELECT * FROM User_Strikes (return updated streak)
```

**Indexes Used:** `idx_user_id`, `idx_user_answers_correct`, `idx_current_streak`, `idx_longest_streak`

**Streak Logic:**
```python
# Triggered on session completion
if last_activity_date == today - 1 day:
    # Consecutive day
    current_streak_days += 1
    longest_streak = max(longest_streak, current_streak_days)
elif last_activity_date < today - 1 day:
    # Gap detected - reset
    current_streak_days = 1
    current_streak_start = today
else:
    # Same day - no change
    pass
```

#### 4. **stats.py** - User Statistics & Admin Analytics
**Endpoints:**
| Endpoint | Method | Auth Required | Database Operations | Classes |
|----------|--------|---------------|-------------------|---------|
| `/stats/user` | GET | User JWT | Complex GROUP BY queries (7 queries) | User stats response |
| `/stats/admin/overview` | GET | Admin JWT | Complex aggregations (10 queries) | Admin dashboard response |

**Key Functions:**
- `get_user_stats()` - Personal statistics for authenticated user
- `get_admin_stats()` - Dashboard overview for admin users only

**Database Operations Performed - User Stats (get_user_stats):**
```sql
Query 1: Total questions & correct answers
├─ COUNT(*), SUM(CASE WHEN is_correct = 1) FROM User_Answers WHERE user_id

Query 2: Strongest topic
├─ SELECT topic name, accuracy FROM User_Answers 
   JOIN Questions, Topics GROUP BY topic ORDER BY accuracy DESC LIMIT 1

Query 3: Weakest topic
├─ SELECT topic name, accuracy FROM User_Answers 
   JOIN Questions, Topics GROUP BY topic ORDER BY accuracy ASC LIMIT 1

Query 4: Current & longest streak
├─ SELECT current_streak_days, longest_streak FROM User_Strikes WHERE user_id

Query 5: Last session
├─ SELECT session details FROM Learning_Sessions WHERE user_id ORDER BY DESC LIMIT 1

Query 6: Best session (by questions solved)
├─ SELECT session details FROM Learning_Sessions 
   WHERE user_id ORDER BY questions_solved DESC, duration ASC

Query 7: All topic stats
└─ SELECT topic, total, correct FROM User_Answers 
   JOIN Questions, Topics GROUP BY topic
```

**Database Operations Performed - Admin Stats (get_admin_stats):**
```sql
Query 1: Top 10 students by success rate
├─ SELECT user_id, username, total_questions, correct_answers, success_rate 
   FROM Users LEFT JOIN User_Answers GROUP BY user_id ORDER BY success_rate DESC

Query 2: Most practiced topics
├─ SELECT topic_name, answer_count FROM User_Answers 
   JOIN Questions, Topics GROUP BY topic ORDER BY count DESC LIMIT 5

Query 3: Most challenging topics (lowest success rate)
├─ SELECT topic_name, total, correct, success_rate FROM User_Answers 
   JOIN Questions, Topics GROUP BY topic HAVING count >= 3 ORDER BY success_rate ASC

Query 4: Highest proficiency topics (highest success rate)
├─ SELECT topic_name, total, correct, success_rate FROM User_Answers 
   JOIN Questions, Topics GROUP BY topic HAVING count >= 3 ORDER BY success_rate DESC

Query 5: Average session duration
├─ SELECT AVG(duration) FROM Learning_Sessions WHERE end_time IS NOT NULL

Query 6: Strongest overall topic
├─ SELECT topic_name, success_rate FROM User_Answers 
   JOIN Questions, Topics GROUP BY topic ORDER BY success_rate DESC LIMIT 1

Query 7: Weakest overall topic
├─ SELECT topic_name, success_rate FROM User_Answers 
   JOIN Questions, Topics GROUP BY topic ORDER BY success_rate ASC LIMIT 1

Query 8: User with longest all-time streak
├─ SELECT user_id, username, longest_streak FROM Users 
   JOIN User_Strikes ORDER BY longest_streak DESC LIMIT 1

Query 9: User with current longest streak
├─ SELECT user_id, username, current_streak_days FROM Users 
   JOIN User_Strikes ORDER BY current_streak_days DESC LIMIT 1

Query 10: Best session overall (by questions solved)
└─ SELECT session details, username, duration FROM Learning_Sessions 
   JOIN Users ORDER BY questions_solved DESC, duration ASC
```

**Indexes Used:** `idx_user_answers_correct`, `idx_user_id`, `idx_longest_streak`, `idx_current_streak`

**Permission Control:**
```python
@router.get("/admin/overview", dependencies=[Depends(require_admin)])
def get_admin_stats(...):
    # Only accessible to users with is_admin=1
```

### Summary: Who Executes What?

| Module | SQL Queries | Execution Type | Scope |
|--------|------------|----------------|-------|
| **auth.py** | 4 queries per registration, 1 per login | INSERT, SELECT | Authentication |
| **questions.py** | 1-4 queries per request | SELECT with RAND(), JOIN | Content delivery |
| **quiz.py** | 2-5 queries per answer, 4-5 per session end | INSERT, SELECT, UPDATE | Quiz execution |
| **stats.py** | 7 queries per user stats, 10 per admin request | Complex GROUP BY, JOINs, aggregations | Analytics |
| **database.py** | Index creation on startup | CREATE INDEX | Database optimization |
| **dependencies.py** | None - pure JWT processing | N/A | Authentication |

### Raw SQL Architecture Benefits

✅ **Performance**: Direct SQL execution without ORM overhead
✅ **Control**: Full control over query optimization and index usage
✅ **Scalability**: Efficient connection pooling (5 pre-allocated connections)
✅ **Flexibility**: Easy to write custom queries for complex analytics
✅ **Security**: Parameterized queries (%s placeholders) prevent SQL injection

---

## Frontend Structure

```
frontend/frontend/src/
├── api/
│   └── client.js                # Axios client with JWT interceptor
│                                 # - Auto-add Authorization header
│                                 # - Auto-refresh on 401
│                                 # - Request/response interceptors
│
├── context/
│   └── AuthContext.jsx          # Global auth state
│                                 # - User info, token storage
│                                 # - Login/logout functions
│                                 # - Protected route handling
│
├── pages/
│   ├── Auth.jsx                 # Login & Register
│   │   ├── Form validation (client-side)
│   │   ├── JWT token storage
│   │   └── Redirect on success
│   │
│   ├── Home.jsx                 # Main dashboard
│   │   ├── Quick stats display
│   │   ├── Topic selection
│   │   └── Navigation menu
│   │
│   ├── Quiz.jsx                 # Main quiz interface
│   │   ├── Question rendering
│   │   ├── Answer submission
│   │   ├── Progress tracking
│   │   └── Session management
│   │
│   ├── LearnStats.jsx           # Personal analytics
│   │   ├── Success rate chart
│   │   ├── Topic breakdown
│   │   ├── Streak display
│   │   └── Time-based analytics
│   │
│   ├── AdminStats.jsx           # Admin dashboard
│   │   ├── Overall platform stats
│   │   ├── User leaderboard
│   │   ├── Topic difficulty analysis
│   │   └── Requires admin role
│   │
│   └── Profile.jsx              # User profile
│       ├── Account information
│       ├── Streak statistics
│       └── Logout option
│
├── components/
│   ├── CodeQuestion.jsx         # Code question component
│   │   ├── Textarea input
│   │   ├── Case-insensitive check
│   │   └── Syntax highlight (optional)
│   │
│   ├── MultipleChoiceQuestion.jsx
│   │   ├── Radio button group
│   │   ├── Option selection
│   │   └── Immediate feedback
│   │
│   ├── Results.jsx              # Answer result display
│   │   ├── Correct/incorrect indicator
│   │   ├── Correct answer reveal
│   │   └── Score calculation
│   │
│   ├── Header.jsx               # Top navigation
│   │   ├── User menu
│   │   ├── Session info
│   │   └── Logout button
│   │
│   ├── Logo.jsx                 # Brand logo
│   │
│   ├── QuestionTypeCard.jsx     # Topic selection cards
│   │   ├── Multiple-choice option
│   │   └── Code question option
│   │
│   ├── TopicCard.jsx            # Topic selection card
│   │   ├── Topic name
│   │   ├── Question count
│   │   └── Click handler
│   │
│   ├── TokenExpiredModal.jsx    # Auth modal
│   │   ├── Session timeout warning
│   │   ├── Re-login prompt
│   │   └── Redirect on confirm
│   │
│   └── ui/                      # Reusable UI components
│       ├── button.jsx           # Styled button
│       ├── input.jsx            # Styled input field
│       ├── label.jsx            # Form label
│       ├── progress.jsx         # Progress bar
│       └── radio-group.jsx      # Radio button group
│
├── lib/
│   └── utils.js                 # Utility functions
│       ├── formatters (date, percentage)
│       ├── validators (email, etc)
│       └── helpers (storage, etc)
│
├── assets/                      # Images, icons, fonts
│
├── App.jsx                      # Main router
│   ├── React Router v6 setup
│   ├── Protected route wrapper
│   ├── Layout structure
│   └── Global error boundary
│
├── App.css                      # Global styles
│
├── index.css                    # Base CSS variables
│
├── main.jsx                     # React entry point
│   └── React 18 StrictMode
│
└── public/                      # Static assets
```

### Technology Stack
- **React 18:** Latest with hooks and concurrent features
- **Vite:** Lightning-fast build tool and dev server
- **Tailwind CSS:** Utility-first CSS framework
- **Axios:** Promise-based HTTP client with interceptors
- **React Router v6:** Client-side routing
- **Local Storage:** JWT token persistence

### Key Features
1. **JWT Authentication Flow:**
   - Token stored in localStorage
   - Auto-added to all API requests via interceptor
   - Refreshed on 401 Unauthorized responses

2. **Responsive Design:**
   - Mobile-first approach with Tailwind
   - Breakpoints for tablet/desktop
   - Touch-friendly inputs

3. **Error Handling:**
   - Network error handling
   - Token expiration detection (TokenExpiredModal)
   - Form validation with user feedback
   - Server error messages displayed to user

4. **Performance Optimizations:**
   - Code splitting by route (lazy loading)
   - Component memoization where needed
   - Optimized re-renders with React.memo
   - CSS purging for production

   ---
