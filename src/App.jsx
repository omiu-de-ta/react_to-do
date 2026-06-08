import { useState, useEffect } from "react";

// ==============================
// APIのURL（バックエンドのアドレス）
// ==============================
const API_URL = "https://react-todo-backend-kl0k.onrender.com";

// ==============================
// ユーティリティ
// ==============================

function getDeadlineStatus(deadline) {
  if (!deadline) return null;
  const today = new Date();
  const d = new Date(deadline);
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  if (d < today) return "overdue";
  if (d.getTime() === today.getTime()) return "today";
  return "future";
}

// ==============================
// タスク1件分のコンポーネント
// ==============================

function TaskItem({ task, onToggle, onDelete, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const [editDeadline, setEditDeadline] = useState(task.deadline || "");

  function handleSave() {
    if (editText.trim() === "") {
      alert("タスクを入力してください");
      return;
    }
    onEdit(task._id, editText, editDeadline);
    setIsEditing(false);
  }

  function handleCancel() {
    setEditText(task.text);
    setEditDeadline(task.deadline || "");
    setIsEditing(false);
  }

  const status = getDeadlineStatus(task.deadline);
  const deadlineStyle =
    status === "overdue" ? { color: "#ff3b30", fontWeight: "bold" } :
    status === "today"   ? { color: "#ff9500", fontWeight: "bold" } : {};

  if (isEditing) {
    return (
      <li style={styles.li}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", flex: 1 }}>
          <input
            style={{ ...styles.input, width: "auto", flex: 1 }}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
          />
          <input
            type="date"
            style={{ ...styles.input, width: "auto" }}
            value={editDeadline}
            onChange={(e) => setEditDeadline(e.target.value)}
          />
          <button style={{ ...styles.button, background: "#4f8cff", color: "white" }} onClick={handleSave}>
            保存
          </button>
          <button style={styles.button} onClick={handleCancel}>
            キャンセル
          </button>
        </div>
      </li>
    );
  }

  return (
    <li style={styles.li}>
      <span
        style={{
          ...styles.taskText,
          ...(task.completed ? styles.completed : {}),
          ...(!task.completed ? deadlineStyle : {}),
          cursor: "pointer",
        }}
        onClick={() => onToggle(task._id, task.completed)}
      >
        {task.completed ? "☑ " : "□ "}
        {task.text}
        {task.deadline && ` 期限: ${task.deadline}`}
      </span>
      <div style={{ display: "flex", gap: "6px" }}>
        <button
          style={{ ...styles.button, background: "#4f8cff", color: "white" }}
          onClick={() => setIsEditing(true)}
        >
          編集
        </button>
        <button
          style={{ ...styles.button, background: "#ff6b6b", color: "white" }}
          onClick={() => onDelete(task._id)}
        >
          削除
        </button>
      </div>
    </li>
  );
}

// ==============================
// メインコンポーネント
// ==============================

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 起動時にサーバーからタスクを取得
  useEffect(() => {
    fetch(`${API_URL}/tasks`)
      .then((res) => res.json())
      .then((data) => {
        setTasks(data);
        setLoading(false);
      })
      .catch(() => {
        setError("サーバーに接続できません。バックエンドが起動しているか確認してください。");
        setLoading(false);
      });
  }, []);

  // タスク追加
  async function handleAdd() {
    if (taskInput.trim() === "") {
      alert("タスクを入力してください");
      return;
    }
    const res = await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: taskInput, deadline: dateInput }),
    });
    const newTask = await res.json();
    setTasks([...tasks, newTask]);
    setFilter("all");
    setTaskInput("");
    setDateInput("");
  }

  // 完了トグル
  async function handleToggle(id, currentCompleted) {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !currentCompleted }),
    });
    const updated = await res.json();
    setTasks(tasks.map((t) => (t._id === id ? updated : t)));
  }

  // 削除
  async function handleDelete(id) {
    await fetch(`${API_URL}/tasks/${id}`, { method: "DELETE" });
    setTasks(tasks.filter((t) => t._id !== id));
  }

  // 編集
  async function handleEdit(id, newText, newDeadline) {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newText, deadline: newDeadline }),
    });
    const updated = await res.json();
    setTasks(tasks.map((t) => (t._id === id ? updated : t)));
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === "active")    return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  return (
    <div style={styles.container}>
      <h1 style={styles.h1}>タスク管理</h1>

      {/* エラー表示 */}
      {error && (
        <p style={{ color: "#ff3b30", textAlign: "center", fontSize: "14px" }}>
          ⚠️ {error}
        </p>
      )}

      {/* 入力エリア */}
      <div style={styles.inputArea}>
        <input
          style={styles.input}
          type="text"
          placeholder="タスクを入力"
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <input
          style={{ ...styles.input, width: "auto" }}
          type="date"
          value={dateInput}
          onChange={(e) => setDateInput(e.target.value)}
        />
        <button
          style={{ ...styles.button, background: "#4f8cff", color: "white" }}
          onClick={handleAdd}
        >
          追加
        </button>
      </div>

      {/* フィルターボタン */}
      <div style={styles.filterArea}>
        {["all", "active", "completed"].map((f) => (
          <button
            key={f}
            style={{ ...styles.button, ...(filter === f ? styles.activeFilter : {}) }}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "すべて" : f === "active" ? "未完了" : "完了"}
          </button>
        ))}
      </div>

      {/* タスクリスト */}
      <ul style={styles.ul}>
        {loading && <p style={{ textAlign: "center", color: "#aaa" }}>読み込み中...</p>}
        {!loading && filteredTasks.map((task) => (
          <TaskItem
            key={task._id}
            task={task}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        ))}
        {!loading && filteredTasks.length === 0 && (
          <p style={{ textAlign: "center", color: "#aaa" }}>タスクはありません</p>
        )}
      </ul>
    </div>
  );
}
const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    maxWidth: "520px",
    margin: "40px auto",
    background: "#f7f8fc",
    color: "#333",
    padding: "0 16px",
  },
  h1: { textAlign: "center", marginBottom: "20px" },
  inputArea: { display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" },
  filterArea: { display: "flex", gap: "6px", marginBottom: "10px" },
  input: {
    padding: "10px",
    width: "65%",
    border: "1px solid #ddd",
    borderRadius: "8px",
    outline: "none",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  button: {
    padding: "9px 12px",
    cursor: "pointer",
    border: "none",
    borderRadius: "8px",
    background: "#e0e0e0",
    fontSize: "14px",
  },
  activeFilter: { background: "#4f8cff", color: "white" },
  ul: { padding: 0, marginTop: "20px", listStyle: "none" },
  li: {
    margin: "10px 0",
    padding: "12px 14px",
    background: "white",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  },
  taskText: { flex: 1, marginRight: "10px", wordBreak: "break-word" },
  completed: { textDecoration: "line-through", color: "#aaa" },
};