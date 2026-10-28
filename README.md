# PostEvent — Akatsuki's Draft: AI-Enabled Content Sharing Platform

A production-ready Node.js & Express backend for **PostEvent (Akatsuki's Draft)**, an AI-powered content and event article sharing platform. Built following the clean architectural conventions established in the Cold Mailer project.

---

## 🌟 Key Features

1. **Authentication & Authorization**:
   - JWT-based authentication with bcrypt password hashing (10 salt rounds).
   - Role-Based Access Control (RBAC): `user` and `admin`.
   - Privilege escalation defense: Public registration always defaults strictly to `role: "user"`.
   - Passwords excluded by default from queries (`select: false`).

2. **Post Management & Moderation Workflow**:
   - Posts feature a 4-state lifecycle: `draft` ➔ `pending` ➔ `approved` / `rejected`.
   - Public feed strictly serves `approved` posts with search, category filtering, and pagination.
   - Authors can create drafts, edit their own posts, and submit them for review (`draft` / `rejected` ➔ `pending`).
   - Admins moderate submissions via approval/rejection endpoints with aggregate platform statistics.

3. **Google Gemini AI Content Enhancement**:
   - Polishes draft titles, descriptions, and content for clarity, flow, and formatting.
   - Generates complete post drafts from a topic and rough bullet points.

4. **Vercel Serverless Optimization**:
   - Express app exported as default handler.
   - Serverless MongoDB connection caching to eliminate duplicate connections across lambda invocations.
   - Clean `vercel.json` rewrites.

---

## 📁 Project Structure

```
postevent/
├── config/
│   └── db.js                 # Serverless-cached MongoDB Mongoose connection
├── controller/
│   ├── auth.controller.js    # Register, login, and user profile
│   ├── post.controller.js    # Post CRUD and author workflow
│   ├── admin.controller.js   # Content moderation, status updates, users list
│   └── ai.controller.js      # Gemini AI content improvement & generation
├── middleware/
│   └── auth.middleware.js    # JWT verification, optionalAuth, and admin role guards
├── model/
│   ├── auth.model.js         # User schema (name, email, password, role)
│   └── post.model.js         # Post schema (title, description, content, image, category, status)
├── routes/
│   ├── auth.routes.js        # /api/auth endpoints
│   ├── post.routes.js        # /api/posts endpoints
│   ├── admin.routes.js       # /api/admin endpoints
│   └── ai.routes.js          # /api/ai endpoints
├── services/
│   └── ai.services.js        # Gemini AI prompt orchestration & JSON parsing
├── utils/
│   └── gemini.utils.js       # Direct Google Gemini REST API caller
├── scripts/
│   └── seedAdmin.js          # Safe CLI script to create or promote an admin
├── .env.example              # Template environment variables
├── .gitignore                # Git ignore configuration
├── vercel.json               # Vercel serverless deployment routing
├── index.js                  # Application entry point & health checks
├── package.json              # ES module configuration & dependencies
└── README.md                 # Complete documentation
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGODB_URL=mongodb+srv://<username>:<password>@cluster0.mongodb.net/postevent?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
GEMINI_API_KEY=your_google_gemini_api_key_here

# Optional: Initial admin credentials for seed script
ADMIN_NAME=Akatsuki Admin
ADMIN_EMAIL=admin@postevent.com
ADMIN_PASSWORD=AdminPassword123!
```

---

## 🚀 Getting Started Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Database Seeding (Create Initial Admin)
```bash
npm run seed:admin
```

### 3. Run Development Server
```bash
npm run dev
```
The server will start at `http://localhost:5000`.

---

## 🛡️ Creating the Initial Admin

To prevent arbitrary users from becoming administrators during public registration:
1. Set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `.env`.
2. Execute the secure seed script:
   ```bash
   npm run seed:admin
   ```
3. If the user already exists, the script promotes their role to `admin`. If not, a new admin account is created safely.

---

## 📡 API Reference

All routes are available with either `/api/` prefix or direct path (e.g., `/api/auth/register` or `/auth/register`).

### 1. Health Checks
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Service status and endpoint sitemap |
| `GET` | `/health` | Public | System uptime and health metric |

---

### 2. Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new user (`name`, `email`, `password`). Always assigns `role: "user"`. |
| `POST` | `/api/auth/login` | Public | Authenticate user (`email`, `password`). Returns JWT token. |
| `GET` | `/api/auth/profile` | Authenticated | Retrieve authenticated user profile. |

---

### 3. Posts (`/api/posts`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/posts` | Public | Feed of `approved` posts. Supports query params: `?category=...&search=...&page=1&limit=10`. |
| `GET` | `/api/posts/my-posts` | Authenticated | List all posts by the logged-in user across all statuses (`draft`, `pending`, `approved`, `rejected`). |
| `POST` | `/api/posts` | Authenticated | Create a new post (`title`, `description`, `content`, `image`, `category`, `status: "draft" \| "pending"`). |
| `GET` | `/api/posts/:id` | Public / Author | Get post details. (Non-approved posts viewable only by author/admin). |
| `PUT` | `/api/posts/:id` | Author Only | Update draft/post fields (`title`, `description`, `content`, `image`, `category`). |
| `PATCH`| `/api/posts/:id/submit`| Author Only | Submit a `draft` or `rejected` post for admin review (sets status to `pending`). |
| `DELETE`| `/api/posts/:id` | Author / Admin | Delete a post. |

---

### 4. Admin Moderation (`/api/admin`)
*(Requires Bearer JWT token of an `admin` user)*

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/posts` | Admin Only | View all posts with platform statistics. Supports `?status=pending`. |
| `PATCH`| `/api/admin/posts/:id/status`| Admin Only | Update post status: `{ "status": "approved" \| "rejected" \| "draft" }`. |
| `GET` | `/api/admin/users` | Admin Only | List all registered users and roles. |
| `DELETE`| `/api/admin/posts/:id` | Admin Only | Force delete any post. |

---

### 5. AI Assistant (`/api/ai`)
*(Requires Bearer JWT token)*

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/improve` | Authenticated | Polish title, description, and content with Google Gemini. Body: `{ content, title, tone, postId }`. |
| `POST` | `/api/ai/generate`| Authenticated | Generate full post draft from topic. Body: `{ topic, category, keyPoints }`. |

---

## ☁️ Vercel Deployment Guide

Follow these steps to deploy PostEvent to Vercel:

### Step 1: Push Project to GitHub
Initialize git and push to your GitHub repository:
```bash
git init
git add .
git commit -m "feat: complete postevent backend"
git remote add origin https://github.com/<your-username>/postevent.git
git branch -M main
git push -u origin main
```

### Step 2: Import into Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** ➔ **Project**.
3. Select your GitHub repository and click **Import**.

### Step 3: Configure Environment Variables
In Vercel **Project Settings ➔ Environment Variables**, add:
- `MONGODB_URL`: Your MongoDB Atlas connection URI (e.g. `mongodb+srv://...`).
- `JWT_SECRET`: A secure random secret key.
- `GEMINI_API_KEY`: Your Google Gemini API Key.
- `PORT`: `5000` (or leave default).

### Step 4: Deploy
Click **Deploy**. Vercel will build and deploy the serverless functions using `vercel.json`.

### Step 5: Verification & Testing
1. Visit `https://<your-project>.vercel.app/` to verify the root health check returns `status: "ok"`.
2. Test `/health` endpoint.
3. Test `/api/auth/register` and `/api/auth/login` to confirm MongoDB Atlas connectivity.
4. Verify deployment logs in the Vercel dashboard.
