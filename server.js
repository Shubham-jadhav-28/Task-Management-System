const express = require("express"); // Import Express
const mysql = require("mysql2"); // Import MySQL
const cors = require("cors"); // Import CORS

const app = express(); // ✅ Initialize Express App

app.use(cors());
app.use(express.json()); // ✅ Add this to parse JSON requests

// MySQL Database Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Pikachu",
  database: "task_management",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed: " + err.message);
  } else {
    console.log("Connected to MySQL Database");
  }
});

// Get All Tasks
app.get("/tasks", (req, res) => {
  db.query("SELECT * FROM tasks", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Get Single Task
app.get("/tasks/:taskId", (req, res) => {
  const taskId = req.params.taskId;
  const query = `
    SELECT task_name, task_owner, reminder, assigned_to, description, 
           start_date, due_date, priority, status 
    FROM tasks WHERE id = ?`;

  db.query(query, [taskId], (err, results) => {
    if (err) {
      console.error("DB Error:", err);
      res.status(500).json({ error: "Database error" });
    } else if (results.length === 0) {
      res.status(404).json({ error: "Task not found" });
    } else {
      res.json(results[0]); // Send task details
    }
  });
});

// Add New Task
app.post("/tasks", (req, res) => {
  const {
    task_owner = "Unknown",
    task_name,
    description,
    start_date,
    due_date,
    priority,
    status,
  } = req.body;

  console.log("Received Task Data:", req.body); // ✅ Debugging

  const sql =
    "INSERT INTO tasks (task_owner, task_name, description, start_date, due_date, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?)";

  db.query(
    sql,
    [
      task_owner,
      task_name,
      description,
      start_date,
      due_date,
      priority,
      status,
    ],
    (err, result) => {
      if (err) {
        console.error("Database Insert Error:", err);
        return res.status(500).json({ error: err.message });
      }

      console.log("Task Added with ID:", result.insertId); // ✅ Debugging
      res.json({ message: "Task added successfully", taskId: result.insertId });
    }
  );
});

// Update Task
app.put("/tasks/:id", (req, res) => {
  const taskId = req.params.id;
  let { task_name, task_owner, start_date, due_date, priority, status } =
    req.body;

  // ✅ Ensure NULL values are handled correctly
  task_owner = task_owner && task_owner.trim() !== "" ? task_owner : null;
  start_date = start_date && start_date.trim() !== "" ? start_date : null;
  due_date = due_date && due_date.trim() !== "" ? due_date : null;

  console.log("🔹 Received Data for Update:", {
    taskId,
    task_name,
    task_owner,
    start_date,
    due_date,
    priority,
    status,
  });

  const sql = `
      UPDATE tasks 
      SET task_name = ?, task_owner = ?, start_date = ?, due_date = ?, priority = ?, status = ? 
      WHERE id = ?`;

  db.query(
    sql,
    [task_name, task_owner, start_date, due_date, priority, status, taskId],
    (err, result) => {
      if (err) {
        console.error("❌ Database Update Error:", err);
        return res.status(500).json({ error: "Database update failed" });
      }

      console.log("✅ Database Update Success:", result);

      if (result.affectedRows === 0) {
        console.warn("⚠ No rows updated. Check if the ID exists.");
        return res
          .status(404)
          .json({ error: "Task not found or no changes made" });
      }

      res.json({ message: "Task updated successfully", updatedTask: req.body });
    }
  );
});

// Delete Task
app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM tasks WHERE id = ?", [id], (err) => {
    if (err) {
      console.error("Database Delete Error:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "Task deleted successfully" });
  });
});

// Start the Server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
// // Redirect with Task ID
// function redirectToForm(taskId) {
//   if (!taskId) {
//     alert("Task ID missing. Cannot redirect.");
//     return;
//   }
//   sessionStorage.setItem("taskId", taskId); // Store Task ID
//   window.location.href = "index2.html"; // Redirect
// }

// // Retrieve Task ID on index2.html
// window.onload = function () {
//   let taskId = sessionStorage.getItem("taskId");

//   if (!taskId) {
//     alert("Error: Task ID missing. Redirecting...");
//     window.location.href = "index.html"; // Redirect back
//   } else {
//     console.log("Task ID:", taskId); // Debugging
//   }
// };
