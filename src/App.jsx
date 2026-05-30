import { useState, useEffect } from "react";

// ========================================
// ユーティリティ関数
// ========================================

// 期限の状態を判定する（元のgetDeadlineStatusと同じロジック）
function getDeadlineStatus(deadline) {
  if (!deadline) return null;

  const today = new Date();
  const d = new Date(deadline);

  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);

  if (d < today) return "overdue"; // 過去 → 赤
  if (d.getTime() === today.getTime()) return "today"; // 今日 → オレンジ

  return "future";
}

// localStorageの読み書き（元のStorageクラスと同じロジック）
function loadFromStorage() {
  const data = localStorage.getItem("tasks");
  try {
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveToStorage(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// ========================================
// 子コンポーネント：タスク1件分
// ========================================

function TaskItem({ task, onToggle, onDelete, onEdit }) {
  // 編集中かどうかを管理するstate
  const [isEditing, setIsEditing] = useState(false);
  // 編集中のテキストと期限を管理するstate
  const [editText, setEditText] = useState(task.text);
  const [editDeadline, setEditDeadline] = useState(task.deadline || "");

  // 保存ボタン
  function handleSave() {
    if (editText.trim() === "") {
      alert("タスクを入力してください");
      return;
    }
    onEdit(task.id, editText, editDeadline);
    setIsEditing(false);
  }

  // キャンセルボタン：入力値を元に戻す
  function handleCancel() {
    setEditText(task.text);
    setEditDeadline(task.deadline || "");
    setIsEditing(false);
  }

  // 期限の色スタイルを決める
  const status = getDeadlineStatus(task.deadline);
  const deadlineStyle =
    status === "overdue"
      ? { color: "#ff3b30", fontWeight: "bold" }
      : status === "today"
      ? { color: "#ff9500", fontWeight: "bold" }
      : {};

  // 編集モードのUI
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

  // 通常モードのUI
  return (
    <li style={styles.li}>
      {/* タスク本文（クリックで完了トグル） */}
      <span
        style={{
          ...styles.taskText,
          ...(task.completed ? styles.completed : {}),
          ...(!task.completed ? deadlineStyle : {}),
          cursor: "pointer",
        }}
        onClick={() => onToggle(task.id)}
      >
        {task.completed ? "☑ " : "□ "}
        {task.text}
        {task.deadline && ` 期限: ${task.deadline}`}
      </span>

      {/* 編集・削除ボタン */}
      <div style={{ display: "flex", gap: "6px" }}>
        <button
          style={{ ...styles.button, background: "#4f8cff", color: "white" }}
          onClick={() => setIsEditing(true)}
        >
          編集
        </button>
        <button
          style={{ ...styles.button, background: "#ff6b6b", color: "white" }}
          onClick={() => onDelete(task.id)}
        >
          削除
        </button>
      </div>
    </li>
  );
}

// ========================================
// メインコンポーネント
// ========================================

export default function App() {
  // タスク一覧のstate（localStorageから初期値を読み込む）
  const [tasks, setTasks] = useState(() => loadFromStorage());
  // 入力フォームのstate
  const [taskInput, setTaskInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  // フィルターのstate
  const [filter, setFilter] = useState("all");

  // tasksが変わるたびにlocalStorageへ保存
  useEffect(() => {
    saveToStorage(tasks);
  }, [tasks]);

  // タスク追加（元のaddTask + イベントリスナーのロジック）
  function handleAdd() {
    if (taskInput.trim() === "") {
      alert("タスクを入力してください");
      return;
    }
    const newTask = {
      id: Date.now(),
      text: taskInput,
      completed: false,
      deadline: dateInput,
    };
    setTasks([...tasks, newTask]);
    setFilter("all"); // 追加したら「すべて」に戻す
    setTaskInput("");
    setDateInput("");
  }

  // 完了トグル（元のtoggleTaskのロジック）
  function handleToggle(id) {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  }

  // 削除（元のdeleteTaskのロジック）
  function handleDelete(id) {
    setTasks(tasks.filter((task) => task.id !== id));
  }

  // 編集（元のeditTaskのロジック）
  function handleEdit(id, newText, newDeadline) {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, text: newText, deadline: newDeadline } : task
      )
    );
  }

  // フィルタリング（元のshouldSkipのロジック）
  const filteredTasks = tasks.filter((task) => {
    if (filter === "active") return !task.completed;
    if (filter === "completed") return task.completed;
    return true; // "all"
  });

  return (
    <div style={styles.container}>
      <h1 style={styles.h1}>タスク管理</h1>

      {/* 入力エリア */}
      <div style={styles.inputArea}>
        <input
          style={styles.input}
          type="text"
          placeholder="タスクを入力"
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          // Enterキーでも追加できるようにする
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
            style={{
              ...styles.button,
              ...(filter === f ? styles.activeFilter : {}),
            }}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "すべて" : f === "active" ? "未完了" : "完了"}
          </button>
        ))}
      </div>

      {/* タスクリスト */}
      <ul style={styles.ul}>
        {filteredTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        ))}
        {filteredTasks.length === 0 && (
          <p style={{ textAlign: "center", color: "#aaa" }}>タスクはありません</p>
        )}
      </ul>
    </div>
  );
}

// ========================================
// スタイル（元のstyle.cssと対応）
// ========================================

const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    maxWidth: "520px",
    margin: "40px auto",
    background: "#f7f8fc",
    color: "#333",
    padding: "0 16px",
  },
  h1: {
    textAlign: "center",
    marginBottom: "20px",
  },
  inputArea: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    marginBottom: "10px",
  },
  filterArea: {
    display: "flex",
    gap: "6px",
    marginBottom: "10px",
  },
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
    transition: "background 0.2s",
  },
  activeFilter: {
    background: "#4f8cff",
    color: "white",
  },
  ul: {
    padding: 0,
    marginTop: "20px",
    listStyle: "none",
  },
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
  taskText: {
    flex: 1,
    marginRight: "10px",
    wordBreak: "break-word",
  },
  completed: {
    textDecoration: "line-through",
    color: "#aaa",
  },
};
