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
app.put("/tasks/:id", async (req, res) => {
  try {
    const taskId = req.params.id;
    const { task_name, description, due_date, priority, status } = req.body;

    console.log("Updating Task ID:", taskId);
    console.log("Received Data:", req.body);

    if (!taskId) return res.status(400).json({ error: "Task ID is missing" });

    const sql =
      "UPDATE tasks SET task_name=?, description=?, due_date=?, priority=?, status=? WHERE id=?";
    const values = [task_name, description, due_date, priority, status, taskId];

    const [result] = await db.query(sql, values);

    if (result.affectedRows > 0) {
      res.json({ message: "Task updated successfully" });
    } else {
      res.status(404).json({ error: "Task not found" });
    }
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
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
