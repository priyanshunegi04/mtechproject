# Project Rules: Thapar (TIET) CSE Elective AI Recommendation & Seat Allocation SaaS

## 1. Domain Context (Thapar Institute of Engineering & Technology - B.E. CSE)
- Follow the official TIET B.E. (CSE) 2026 curriculum scheme (`UCS`, `UMC`, `UMA`, `UTA`, `UES`, `UHU`, `UEC` course codes).
- Students complete Semesters I–IV core courses (`UES103` Programming for Problem Solving, `UCS301` Data Structures, `UCS303` OS, `UTA018` OOP, `UCS405` Discrete Math, `UMA021` Numerical Linear Algebra, `UCS415` DAA, `UCS310` DBMS, `UCS414` Computer Networks, `UCS321` AI for Engineers, `UMA401` Probability & Statistics) and select 1 of 12 Elective Focus (EF) baskets after Semester IV.
- Professional Electives follow a 4-course progression: Elective I (Sem V), Elective II & Elective III (Sem VI), and Elective IV (Sem VII), plus 1 Generic Elective (Sem V, 2.0 Cr).
- Grading scale follows Thapar's 10-point CGPA/SGPA system: `A+` (10), `A` (10), `A-` (9), `B` (8), `B-` (7), `C` (6), `C-` (5), `E` (2), `F` (0).
- Evaluation breakdown for courses: Mid-Semester Test (MST: 25-30%), End-Semester Test (EST: 40-45%), and Sessional/Lab/Project work (30%).

## 2. Production Cloud & Database Rules (Strict Zero-Localhost Policy)
- **Cloud Database Only**: Never hardcode `localhost:27017` or `127.0.0.1` in database, Redis, or microservice clients. Always connect to remote cloud clusters via validated environment variables (`MONGODB_URI` using `mongodb+srv://`, `REDIS_URL` using `rediss://`, `ML_SERVICE_URL`, `VITE_API_BASE_URL`).
- **Mongoose Production Connection Pool**: Configure `maxPoolSize`, `minPoolSize`, `serverSelectionTimeoutMS`, `socketTimeoutMS`, `retryWrites=true`, `w=majority`, exponential backoff reconnection, and `SIGTERM`/`SIGINT` graceful shutdown hooks.
- **Enterprise Security**: Enforce Zod environment validation at startup, `helmet`, `express-mongo-sanitize`, `hpp`, rate limiting, strict CORS origin allowlisting, HTTP-only refresh cookies + JWT access tokens, and immutable audit logs for all administrative actions.
- **No Placeholders**: Never leave `TODO` comments, mock stub arrays, or truncated files. Every endpoint, ML model pipeline, database transaction, and UI view must be production-ready.
