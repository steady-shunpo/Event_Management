require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const router = require("./routes/event-routes");
const cors = require("cors");
const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use("/events", router); // localhost:5000/events

mongoose
    .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected To Database"))
  .then(() => {
    app.listen(process.env.PORT);
  })
  .catch((err) => console.log(err));
// npm install --legacy-peer-deps
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors'); // Import the CORS middleware

// const app = express();
// app.use(express.json());

// // Connect to MongoDB
// mongoose
// .connect("mongodb://admin:anish123@ac-afbk2vi-shard-00-00.3u2eg94.mongodb.net:27017,ac-afbk2vi-shard-00-01.3u2eg94.mongodb.net:27017,ac-afbk2vi-shard-00-02.3u2eg94.mongodb.net:27017/?ssl=true&replicaSet=atlas-119wuu-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0")
// const db = mongoose.connection;
// db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// // Middleware to enable CORS
// app.use(cors()); // Add this line to enable CORS

// // Routes
// const eventsRouter = require('./routes/events');
// app.use('/events', eventsRouter);

// // Start the server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });












































// 🔹 1. EC2 pe connect ho (tu already ho)
// ssh -i your-key.pem ec2-user@your-ip

// - MOST COMMON ISSUE → Security Group
// AWS me ja:
// 👉 EC2 → Security Groups → Inbound Rules
// Ensure ye ports open hain:
// Type
// Port
// HTTP
// 80
// Custom TCP
// 3000
// Custom TCP
// 5000
// Custom TCP
// 5173
// 👉 Source: 0.0.0.0/0

// 🔹 2. System update + Node install
// sudo dnf update -y
// curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
// sudo dnf install -y nodejs git
// Check:
// node -v
// npm -v

// 🔹 3. GitHub repo clone kar
// git clone https://github.com/kaustubhgharat/Student_Record_Management.git
// cd Student_Record_Management

// ⚙️ BACKEND SETUP
// 🔹 4. Backend install + run
// cd backend
// npm install

// 🔹 5. Backend run kar
// node server.js

// 🔹 6. Frontend install ( terminal 2 me frontend run kro)
// cd frontend
// npm install
// npm run dev / npm start
// npm run dev -- --host(Task_Manager)

// 🔹 8. .env fix kar (VERY IMPORTANT)
// Nano .env
// Frontend me:
// VITE_BACKEND_BASE_URL=http://<EC2_PUBLIC_IP>:5000


// 🌍 FINAL ACCESS
// Browser me open:
// http://<EC2_PUBLIC_IP>:3000

