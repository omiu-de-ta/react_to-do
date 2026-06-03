require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// ==============================
// ミドルウェア
// ==============================
app.use(express.json());

// CORS制限（本番はフロントURLに固定）
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

// ==============================
// MongoDB接続
// ==============================
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("MongoDBに接続しました"))
  .catch((err) => {
    console.error("DB接続エラー:", err);
    process.exit(1);
  });

// ==============================
// スキーマ（バリデーション強化）
// ==============================
const taskSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    deadline: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

// ==============================
// ユーティリティ（更新可能フィールド制限）
// ==============================
const allowedUpdateFields = ["text", "completed", "deadline"];

function filterUpdateBody(body) {
  const filtered = {};
  for (const key of allowedUpdateFields) {
    if (body[key] !== undefined) filtered[key] = body[key];
  }
  return filtered;
}

// ==============================
// API
// ==============================

// GET 全取得
app.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: 1 });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "タスク取得に失敗しました" });
  }
});

// POST 追加
app.post("/tasks", async (req, res) => {
  try {
    const { text, deadline } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "textは必須です" });
    }

    const task = new Task({
      text: text.trim(),
      deadline: deadline || null,
    });

    const saved = await task.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "タスク作成に失敗しました" });
  }
});

// PUT 更新（ホワイトリスト方式）
app.put("/tasks/:id", async (req, res) => {
  try {
    const safeBody = filterUpdateBody(req.body);

    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: safeBody },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updated) {
      return res.status(404).json({ error: "タスクが見つかりません" });
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "更新に失敗しました" });
  }
});

// DELETE 削除
app.delete("/tasks/:id", async (req, res) => {
  try {
    const deleted = await Task.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "タスクが見つかりません" });
    }

    res.json({ message: "削除しました" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "削除に失敗しました" });
  }
});

// ==============================
// 404ハンドラ
// ==============================
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// ==============================
// サーバー起動
// ==============================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`サーバー起動: http://localhost:${PORT}`);
});