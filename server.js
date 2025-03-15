require("dotenv").config();
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// ✅ Use a Connection Pool
const db = mysql.createPool({
  connectionLimit: 10,
  host: "localhost",
  user: "root",
  password: "Pikachu", // ✅ Update this
  database: "task_management",
});
app.use(
  cors({
    origin: "http://127.0.0.1:5500", // Allow frontend
    methods: "GET, POST, PUT, DELETE",
    allowedHeaders: "Content-Type",
  })
);

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Improved Query Handling with Connection Pool
app.post("/add-task", (req, res) => {
  console.log("Incoming request body:", req.body);

  const {
    owner,
    taskName,
    description = "",
    startDate = null,
    dueDate = null,
    reminder = null,
    priority = "Moderate",
    status,
  } = req.body;

  if (!taskName || !status || !owner) {
    console.error("Missing required fields!");
    return res
      .status(400)
      .json({ message: "Task Name, Owner, and Status are required!" });
  }
  const reminderFormatted = reminder
    ? new Date(reminder).toISOString().slice(0, 19).replace("T", " ")
    : null;

  const sql =
    "INSERT INTO tasks (owner, task_name, description, start_date, due_date, reminder, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
  const values = [
    owner,
    taskName,
    description,
    startDate,
    dueDate,
    reminderFormatted,
    priority,
    status,
  ];

  db.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ message: "Database connection error!" });
    }

    connection.query(sql, values, (err, result) => {
      connection.release(); // ✅ Always release the connection

      if (err) {
        console.error("❌ Query execution error:", err);
        return res
          .status(500)
          .json({ message: "Database error!", error: err.sqlMessage });
      }
      res.json({ message: "Task added successfully!" });
    });
  });
});

// app.delete("/delete-task/:id", (req, res) => {
//   const taskId = req.params.id;

//   const sql = "DELETE FROM tasks WHERE id = ?";
//   db.query(sql, [taskId], (err, result) => {
//     if (err) {
//       console.error("❌ Delete Task Error:", err);
//       return res
//         .status(500)
//         .json({ message: "Database error!", error: err.sqlMessage });
//     }
//     if (result.affectedRows === 0) {
//       return res.status(404).json({ message: "Task not found!" });
//     }
//     res.json({ message: "Task deleted successfully!" });
//   });
// });

app.get("/tasks", (req, res) => {
  const sql = "SELECT * FROM tasks";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res
        .status(500)
        .json({ message: "Database error!", error: err.sqlMessage });
    }
    res.json(results);
  });
});

// ✅ Start the Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} 🚀`);
});
