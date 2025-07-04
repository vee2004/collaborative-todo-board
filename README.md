# 🧩 Collaborative Real-Time Kanban To-Do Board

A fully custom-built real-time collaborative Kanban board that enables teams to manage tasks seamlessly. Features include drag-and-drop, smart assignment, conflict resolution, and live updates — inspired by Trello, but built from scratch using the MERN stack and Socket.IO.

---

## 🚀 Live Demo

🌐 [Live App](https://collaborative-todo-board-2eaq.vercel.app/)  
🎥 [Demo Video](https://drive.google.com/file/d/1yQp3LXmIbZGN8w7Usdx5DEoqt3RE9Sqp/view?usp=sharing)  
📦 [GitHub Repository](https://github.com/vee2004/collaborative-todo-board)

---

## 🛠 Tech Stack

| Layer      | Technology                            |
|------------|----------------------------------------|
| Frontend   | React (Hooks, CSS Modules)             |
| Backend    | Node.js, Express, MongoDB Atlas        |
| Real-time  | Socket.IO                              |
| Auth       | JWT (JSON Web Token), Bcrypt           |
| Hosting    | Vercel (Frontend), Render (Backend)    |

---

## ✨ Features

### 🔐 Authentication
- JWT-based registration & login
- Passwords secured using bcrypt hashing

### 🗂️ Kanban Board
- Three columns: **Todo**, **In Progress**, **Done**
- Tasks have title, description, priority, and assigned user
- Tasks are draggable across columns
- Fully responsive UI

### 🔄 Real-Time Sync
- All user actions are synced instantly across connected sessions using **Socket.IO**

### 🧠 Smart Assign
- One-click auto-assign to the user with the fewest active tasks
- Promotes fair workload distribution

### ⚠️ Conflict Resolution
- Detects concurrent edits to the same task using versioning
- Presents a Conflict Resolver dialog with options to:
  - Merge field-by-field
  - Keep user’s version
  - Accept server’s version

### 🧾 Activity Log
- Displays the 20 most recent actions
- Updated in real time as tasks are modified

### 💅 UI & Animations
- Custom CSS (no UI libraries used)
- Smooth drag-and-drop animations and transitions

---

## 📦 Local Setup Instructions

```bash
# Clone the repository
git clone https://github.com/vee2004/collaborative-todo-board.git
cd collaborative-todo-board

# Backend setup
cd backend
npm install

# Configure .env file
MONGO_URI=your_mongodb_atlas_url
JWT_SECRET=your_jwt_secret

npm start

# Frontend setup
cd ../frontend
npm install
npm start
