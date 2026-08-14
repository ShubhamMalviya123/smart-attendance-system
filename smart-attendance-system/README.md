# Smart AI Classroom Attendance System — Setup Guide

Is project me 4 parts hain:
1. **database/** — MySQL schema
2. **backend/** — Spring Boot (Java) REST API + JWT security
3. **ai-service/** — Python FastAPI face detection/recognition service
4. **frontend/** — React app (Admin + Teacher panels)

Sab teeno services (backend, ai-service, frontend) **alag-alag terminal me chalani hongi** — ye ek doosre se REST API ke through baat karte hain.

```
Browser (React :3000) → Spring Boot (:8080) → Python AI Service (:8000)
                              ↓
                          MySQL (:3306)
```

---

## PREREQUISITES (pehle inhe install karo)

| Tool | Version | Check command |
|---|---|---|
| Java JDK | 17+ | `java -version` |
| Maven | 3.8+ | `mvn -version` |
| MySQL | 8+ | `mysql --version` |
| Python | 3.10+ | `python3 --version` |
| Node.js | 18+ | `node --version` |

---

## STEP 1 — Database Setup

```bash
cd database
mysql -u root -p
```
MySQL prompt me:
```sql
SOURCE schema.sql;
```
Ya seedha:
```bash
mysql -u root -p < schema.sql
```

**⚠️ Important:** `schema.sql` me seed data ke passwords `PLACEHOLDER_HASH` hai — ye kaam nahi karega jab tak Step 2 me tum ek real user add na karo (Admin API se, jo password ko BCrypt se hash karta hai). Login test karne ke liye Step 4 dekho.

---

## STEP 2 — Backend Setup (Spring Boot)

### 2.1 Config update karo
`backend/src/main/resources/application.yml` khol kar ye lines update karo:
```yaml
spring:
  datasource:
    username: root
    password: YOUR_MYSQL_PASSWORD_HERE   # <-- apna MySQL password daalo
```

### 2.2 Build & Run
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Agar sab sahi hai to terminal me dikhega:
```
Tomcat started on port(s): 8080
```

### 2.3 Test karo (Postman/curl se)
```bash
curl http://localhost:8080/api/auth/login
```
(401 ya validation error aayega bina body ke — matlab server chal raha hai ✅)

### Common Issues:
- **`Access denied for user 'root'`** → password galat hai application.yml me, ya MySQL user permissions check karo
- **`Unknown database 'smart_attendance_db'`** → Step 1 phir se run karo
- **Port 8080 already in use** → `application.yml` me `server.port: 8081` kar do

---

## STEP 3 — AI Service Setup (Python)

### 3.1 Virtual environment banao (recommended)
```bash
cd ai-service
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
```

### 3.2 Dependencies install karo
```bash
pip install -r requirements.txt
```

**⚠️ Most common issue: `dlib` install fail hona (especially Windows pe)**

Agar `dlib` install nahi ho raha:
- **Windows:** Visual Studio Build Tools install karo (C++ build tools), ya `conda install -c conda-forge dlib` try karo
- **Mac:** `brew install cmake` pehle karo, fir `pip install dlib`
- **Linux/WSL (recommended):** `sudo apt install cmake build-essential` pehle karo

Agar phir bhi issue aaye, mujhe exact error message bhejo — main fix karunga.

### 3.3 Run karo
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### 3.4 Test karo
Browser me kholo: `http://localhost:8000/health`
Response aana chahiye: `{"status": "AI service is running"}`

Swagger UI (interactive API docs) dekhne ke liye: `http://localhost:8000/docs`

---

## STEP 4 — Frontend Setup (React)

### 4.1 Dependencies install karo
```bash
cd frontend
npm install
```

### 4.2 Run karo
```bash
npm start
```
Browser automatically khulega: `http://localhost:3000`

### Common Issues:
- **`Module not found`** → `npm install` phir se chalao
- **CORS error in browser console** → check karo backend `SecurityConfig.java` me `localhost:3000` allow hai (already configured hai)

---

## STEP 5 — First-time Login Setup (IMPORTANT)

Koi manual SQL/password setup nahi karna hai — jab tum backend **pehli baar run karoge** (`mvn spring-boot:run`), ek `DataInitializer` automatically ek default Admin account bana dega, with a properly generated BCrypt hash (guesswork nahi, real Spring code se generate hota hai). Terminal me ye dikhega:

```
=================================================
Default admin created:
  email:    admin@college.edu
  password: admin123
  -> Please change this password after first login
=================================================
```

1. Isi email/password se login karo: `admin@college.edu` / `admin123`
2. Login hone ke baad, Admin Dashboard se real Teachers/Subjects add karo — unke passwords bhi automatically BCrypt se hash honge
3. **Production me is default password ko turant change kar dena**

---

## RUNNING ORDER (har baar jab kaam karna ho)

Teen alag terminal windows kholo:

**Terminal 1 — MySQL** (agar service already nahi chal rahi):
```bash
sudo service mysql start
```

**Terminal 2 — AI Service:**
```bash
cd ai-service
source venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 3 — Backend:**
```bash
cd backend
mvn spring-boot:run
```

**Terminal 4 — Frontend:**
```bash
cd frontend
npm start
```

---

## TESTING THE FULL FLOW

1. Admin login → Add Teacher → Add Student → Register Face (upload 1-5 clear photos of the student's face)
2. Add Subject (link to teacher)
3. Logout → Login as Teacher
4. Create Class (select subject, semester, section, date, time)
5. Take Attendance → Upload Images or Video → wait for processing
6. See Present/Absent results

---

## KNOWN LIMITATIONS (abhi is version me nahi hai — future scope)

- PDF/Excel export ke actual endpoints abhi nahi bane hain (README me plan hai, code nahi — agla step)
- Dashboard summary/charts page abhi nahi bana
- Student-wise/Subject-wise/Teacher-wise reports abhi nahi bane
- Reports module (Daily/Weekly/Monthly) abhi nahi bana
- Live camera attendance (future feature) abhi nahi hai

Agar tumhe in me se koi part chahiye, bata dena — main next likh dunga.

---

## AGAR KOI ERROR AAYE

Jo bhi error aaye, exact error message copy-paste karke bhej do (terminal se ya browser console se). Main:
1. Error ka root cause batunga
2. Fix karunga
3. Updated file dunga

Guessing se better hai exact error dekh kar fix karna.
