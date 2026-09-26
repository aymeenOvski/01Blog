# 01Blog

<p align="center">
  <strong>A social blogging platform for students to share, discover, and grow together.</strong>
</p>

01Blog is a fullstack web application built with **Spring Boot** and **Angular**.

Users can create posts, share images and videos, follow other students, interact through likes and comments, receive notifications, and report inappropriate content.

Administrators can moderate users, posts, and reports through a dedicated dashboard.

## ✨ Features

* 🔐 JWT authentication & Spring Security
* 👥 User profiles & subscriptions
* 📝 Create, edit & delete posts
* ❤️ Likes & 💬 comments
* 🖼️ Image & video uploads with previews
* 🔔 Real-time notifications with WebSockets
* 🚩 User & post reporting
* 🛡️ Admin moderation dashboard
* 📊 Basic admin statistics
* 📱 Responsive interface

## 🛠️ Tech Stack

**Backend**

`Java 21` · `Spring Boot 3.2.5` · `Spring Security` · `JWT` · `JPA/Hibernate` · `PostgreSQL` · `Flyway` · `WebSocket`

**Frontend**

`Angular 21` · `TypeScript 5.9` · `RxJS` · `Bootstrap 5.3` · `STOMP.js` · `SockJS`

## 📁 Project Structure

```text
01Blog/
├── backend/     # Spring Boot REST API
├── frontend/    # Angular application
├── setup.sh     # Development environment setup
└── README.md
```

The Angular application is organized by features such as authentication, home, profile, posts, notifications, and administration.

---

# 🚀 Getting Started

## 1. Requirements

The project can be developed without Docker.

The recommended setup uses **Micromamba** to provide the required development tools:

* Java 21
* Maven
* Node.js / npm
* PostgreSQL

A Unix-like shell is required to run `setup.sh`.

This can be:

* Linux
* macOS
* WSL on Windows

---

## 2. Setup the Development Environment

A `setup.sh` script is provided to install Micromamba and create the project's development environment.

From the root of the repository:

```bash
chmod +x setup.sh
./setup.sh
```

The script will:

1. Install Micromamba if necessary.
2. Initialize Micromamba for the current shell.
3. Create the `01blog` environment.
4. Install:

   * OpenJDK 21
   * Maven
   * Node.js
   * PostgreSQL
5. Activate the `01blog` environment.
6. Install the Angular dependencies with `npm install`.

After the script completes, activate the environment in a new shell with:

```bash
micromamba activate 01blog
```

You can verify the installed tools with:

```bash
java -version
mvn -version
node -v
npm -v
postgres --version
```

---

## 3. PostgreSQL Setup

The Micromamba environment provides the PostgreSQL binaries, but PostgreSQL still needs a **database cluster** before the server can run.

Create a PostgreSQL data directory:

```bash
mkdir -p ~/.postgresql/01blog
```

Initialize the cluster:

```bash
initdb -D ~/.postgresql/01blog
```

Start PostgreSQL on port `5433`:

```bash
pg_ctl -D ~/.postgresql/01blog -o "-p 5433" -l ~/.postgresql/01blog.log start
```

Check that PostgreSQL is running:

```bash
pg_isready -p 5433
```

Create the database:

```bash
createdb -p 5433 myblog
```

The backend expects the following connection:

```text
jdbc:postgresql://localhost:5433/myblog
```

### Stopping PostgreSQL

When you are finished working:

```bash
pg_ctl -D ~/.postgresql/01blog stop
```

---

## 4. Environment Variables

The backend requires the following environment variables:

```text
DB_USERNAME
DB_PASSWORD
JWT_SECRET
ADMIN_USERNAME
ADMIN_EMAIL
ADMIN_PASSWORD
```

Set them in your shell before starting the backend.

For example:

```bash
export DB_USERNAME="postgres"
export DB_PASSWORD="your_password"
export JWT_SECRET="$(openssl rand -base64 32)"
export ADMIN_USERNAME="admin"
export ADMIN_EMAIL="admin@example.com"
export ADMIN_PASSWORD="your_admin_password"
```

You can verify that a variable is set without printing sensitive values:

```bash
echo "$DB_USERNAME"
echo "$ADMIN_USERNAME"
echo "$ADMIN_EMAIL"
```

---

## 5. Run the Backend

Make sure the Micromamba environment is active:

```bash
micromamba activate 01blog
```

Then:

```bash
cd backend
mvn spring-boot:run
```

The Spring Boot application will connect to:

```text
jdbc:postgresql://localhost:5433/myblog
```

Flyway will apply the database migrations automatically when the application starts.

---

## 6. Run the Frontend

Open another terminal and activate the environment:

```bash
micromamba activate 01blog
```

Then:

```bash
cd frontend
npm start
```

The Angular development server will start using the project's configured development settings.

---

## 7. Daily Development Workflow

After the initial setup, you do not need to run `setup.sh` every time.

Start PostgreSQL:

```bash
micromamba activate 01blog

pg_ctl -D ~/.postgresql/01blog -o "-p 5433" -l ~/.postgresql/01blog.log start
```

Then start the backend:

```bash
cd backend
mvn spring-boot:run
```

In another terminal:

```bash
micromamba activate 01blog

cd frontend
npm start
```

When finished, stop PostgreSQL:

```bash
pg_ctl -D ~/.postgresql/01blog stop
```

---

## 🔒 Security

The application uses:

* Spring Security and JWT for authentication
* Role-based access control for users and administrators
* BCrypt password hashing
* Flyway database migrations
* Validation for incoming requests
* File type and size validation for media uploads

Secrets such as database passwords, JWT secrets, and administrator credentials must be provided through environment variables and must not be committed to Git.

---

## 📚 Project Context

01Blog was developed as a fullstack project focused on:

* REST API development with Spring Boot
* Angular application architecture
* Relational database design
* Authentication and authorization
* User-generated content and media
* Moderation and administration
* Real-time communication with WebSockets

## 📄 License

Developed as part of the **Zone01 Oujda** curriculum.
