# Collaborative Kanban Todo Board

A real-time collaborative Kanban board for task management, featuring user authentication, activity logs, smart assignment, and conflict handling.

---

## Tech Stack Used

- **Frontend:** React (Create React App), React Router, Socket.IO Client
- **Backend:** Node.js, Express, Socket.IO, MongoDB (via Mongoose), JWT for authentication
- **Other:** bcryptjs, dotenv, CORS

---

## Setup and Installation Instructions

### Prerequisites

- Node.js (v16+ recommended)
- MongoDB (local or cloud instance)

### Backend

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```
2. **Configure environment:**
   - Create a `.env` file in `backend/` with your MongoDB URI and JWT secret:
     ```
     MONGO_URI=your_mongodb_uri
     JWT_SECRET=your_jwt_secret
     ```
3. **Start the backend server:**
   ```bash
   npm run dev
   ```
   The backend runs on [http://localhost:5000](http://localhost:5000).

### Frontend

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```
2. **Start the frontend:**
   ```bash
   npm start
   ```
   The frontend runs on [http://localhost:3000](http://localhost:3000) and proxies API requests to the backend.

---

## Features List and Usage Guide

- **User Authentication:** Register and log in to access the board.
- **Kanban Board:** Tasks are organized in Todo, In Progress, and Done columns.
- **Task Management:** Create, edit, delete, assign, and move tasks via drag-and-drop.
- **Real-Time Collaboration:** All changes are synced live across users using Socket.IO.
- **Activity Log:** View a real-time log of all actions (create, update, move, assign, delete).
- **Smart Assign:** Automatically assigns a task to the user with the fewest current tasks (except for Done tasks).
- **Conflict Handling:** If two users edit the same task simultaneously, a conflict resolver modal allows merging or choosing a version.
- **Responsive UI:** Clean, modern interface with drag-and-drop and modals for task editing.

### Usage Guide

1. **Register/Login:** Create an account or log in.
2. **Create Tasks:** Click "New Task", fill in details, and assign if desired.
3. **Edit/Move Tasks:** Drag tasks between columns or click "Edit" to update details.
4. **Smart Assign:** For tasks not in Done, click "Smart Assign" to auto-assign to the least busy user.
5. **Activity Log:** See all board activity in the right panel.
6. **Conflict Resolution:** If a version conflict occurs, a modal will prompt you to merge or choose a version.

---

## Explanations for Smart Assign and Conflict Handling Logic

### Smart Assign

- **Purpose:** Distributes tasks evenly by assigning to the user with the fewest current tasks.
- **How it works:**
  - When "Smart Assign" is clicked (except for Done tasks), the backend counts tasks per user and selects the user with the lowest count.
  - The task is then assigned to that user, and the action is logged.
  - The button is hidden for tasks in the Done column.

### Conflict Handling

- **Purpose:** Prevents data loss when multiple users edit the same task at once.
- **How it works:**
  - Each task has a version number.
  - When updating, if the version on the server is newer than the one being edited, a conflict is detected.
  - A modal appears showing both versions and allows the user to merge fields or choose which version to keep.

---

## Live Demo

- **App:** [Your Deployed App Link Here](#)
- **Demo Video:** [Your Demo Video Link Here](#)
