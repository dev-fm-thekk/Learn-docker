"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ──────────────────────────────────────────────────────
interface Todo {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

type FilterMode = "all" | "active" | "completed";

// ─── API helpers ────────────────────────────────────────────────
const API_BASE = "/api/v1/todo";

async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error("Failed to fetch todos");
  return res.json();
}

async function createTodo(
  title: string,
  description?: string
): Promise<Todo> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description: description || undefined }),
  });
  if (!res.ok) throw new Error("Failed to create todo");
  return res.json();
}

async function updateTodo(
  id: number,
  data: Partial<Pick<Todo, "title" | "description" | "completed">>
): Promise<Todo> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update todo");
  return res.json();
}

async function deleteTodo(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete todo");
}

// ─── Main Component ─────────────────────────────────────────────
export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>("all");

  // Form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const titleInputRef = useRef<HTMLInputElement>(null);
  const editTitleRef = useRef<HTMLInputElement>(null);

  // ── Fetch ───────────────────────────────────────────────────
  useEffect(() => {
    let ignore = false;
    async function loadTodos() {
      try {
        const data = await fetchTodos();
        if (!ignore) {
          setTodos(data);
          setError(null);
        }
      } catch {
        if (!ignore) {
          setError("Could not load todos. Is the backend running?");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    loadTodos();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (showForm && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [showForm]);

  useEffect(() => {
    if (editingId !== null && editTitleRef.current) {
      editTitleRef.current.focus();
    }
  }, [editingId]);

  // ── Handlers ────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSubmitting(true);
    try {
      const todo = await createTodo(newTitle.trim(), newDescription.trim());
      setTodos((prev) => [todo, ...prev]);
      setNewTitle("");
      setNewDescription("");
      setShowForm(false);
    } catch {
      setError("Failed to create todo");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (todo: Todo) => {
    // Optimistic update
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todo.id ? { ...t, completed: !t.completed } : t
      )
    );
    try {
      await updateTodo(todo.id, { completed: !todo.completed });
    } catch {
      // Revert on failure
      setTodos((prev) =>
        prev.map((t) =>
          t.id === todo.id ? { ...t, completed: todo.completed } : t
        )
      );
      setError("Failed to update todo");
    }
  };

  const handleDelete = async (id: number) => {
    const original = todos;
    setTodos((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteTodo(id);
    } catch {
      setTodos(original);
      setError("Failed to delete todo");
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDescription(todo.description || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId === null || !editTitle.trim()) return;
    try {
      const updated = await updateTodo(editingId, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
      });
      setTodos((prev) =>
        prev.map((t) => (t.id === editingId ? updated : t))
      );
      cancelEdit();
    } catch {
      setError("Failed to update todo");
    }
  };

  // ── Derived data ────────────────────────────────────────────
  const filteredTodos = todos.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;

  // ── Render ──────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "48px 16px 80px",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "fixed",
          top: "-200px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle, rgba(108,92,231,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: "640px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <header className="animate-fade-in-up" style={{ marginBottom: "40px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "var(--gradient-accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                boxShadow: "var(--shadow-glow)",
              }}
            >
              ✓
            </div>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Todos
            </h1>
          </div>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "15px",
              paddingLeft: "54px",
            }}
          >
            {activeCount} task{activeCount !== 1 ? "s" : ""} remaining
            {completedCount > 0 && ` · ${completedCount} done`}
          </p>
        </header>

        {/* ── Error banner ───────────────────────────────── */}
        {error && (
          <div
            className="animate-slide-down"
            style={{
              marginBottom: "20px",
              padding: "14px 18px",
              borderRadius: "12px",
              background: "var(--danger-glow)",
              border: "1px solid rgba(255,107,107,0.3)",
              color: "var(--danger)",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{
                background: "none",
                border: "none",
                color: "var(--danger)",
                cursor: "pointer",
                fontSize: "18px",
                lineHeight: 1,
                padding: "0 0 0 12px",
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* ── Add button / Form ──────────────────────────── */}
        {!showForm ? (
          <button
            id="add-todo-btn"
            onClick={() => setShowForm(true)}
            className="animate-fade-in"
            style={{
              width: "100%",
              padding: "16px 20px",
              borderRadius: "16px",
              border: "1px dashed var(--border)",
              background: "transparent",
              color: "var(--text-muted)",
              fontSize: "15px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              transition: "all 0.2s ease",
              marginBottom: "24px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--accent)";
              e.currentTarget.style.background = "var(--accent-glow)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <span
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "var(--surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: 300,
              }}
            >
              +
            </span>
            Add a new task…
          </button>
        ) : (
          <form
            onSubmit={handleCreate}
            className="animate-scale-in"
            style={{
              marginBottom: "24px",
              padding: "20px",
              borderRadius: "16px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <input
              ref={titleInputRef}
              id="new-todo-title"
              type="text"
              placeholder="What needs to be done?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 0",
                background: "transparent",
                border: "none",
                borderBottom: "1px solid var(--border)",
                color: "var(--text-primary)",
                fontSize: "16px",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <input
              id="new-todo-description"
              type="text"
              placeholder="Add a description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 0",
                background: "transparent",
                border: "none",
                color: "var(--text-secondary)",
                fontSize: "14px",
                outline: "none",
                fontFamily: "inherit",
                marginTop: "4px",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "16px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setNewTitle("");
                  setNewDescription("");
                }}
                style={{
                  padding: "8px 18px",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-hover)";
                  e.currentTarget.style.background = "var(--surface-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Cancel
              </button>
              <button
                id="submit-todo-btn"
                type="submit"
                disabled={!newTitle.trim() || submitting}
                style={{
                  padding: "8px 22px",
                  borderRadius: "10px",
                  border: "none",
                  background:
                    !newTitle.trim() || submitting
                      ? "var(--surface-active)"
                      : "var(--gradient-accent)",
                  color:
                    !newTitle.trim() || submitting
                      ? "var(--text-muted)"
                      : "#fff",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor:
                    !newTitle.trim() || submitting
                      ? "not-allowed"
                      : "pointer",
                  transition: "all 0.15s ease",
                  boxShadow:
                    newTitle.trim() && !submitting
                      ? "var(--shadow-glow)"
                      : "none",
                  fontFamily: "inherit",
                }}
              >
                {submitting ? "Adding…" : "Add Task"}
              </button>
            </div>
          </form>
        )}

        {/* ── Filter tabs ────────────────────────────────── */}
        {todos.length > 0 && (
          <div
            className="animate-fade-in"
            style={{
              display: "flex",
              gap: "4px",
              marginBottom: "20px",
              padding: "4px",
              borderRadius: "12px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            {(["all", "active", "completed"] as FilterMode[]).map((f) => (
              <button
                key={f}
                id={`filter-${f}`}
                onClick={() => setFilter(f)}
                style={{
                  flex: 1,
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background:
                    filter === f ? "var(--surface-active)" : "transparent",
                  color:
                    filter === f
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                  fontSize: "13px",
                  fontWeight: filter === f ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  textTransform: "capitalize",
                  fontFamily: "inherit",
                }}
              >
                {f}
                {f === "all" && ` (${todos.length})`}
                {f === "active" && ` (${activeCount})`}
                {f === "completed" && ` (${completedCount})`}
              </button>
            ))}
          </div>
        )}

        {/* ── Loading skeleton ───────────────────────────── */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: "72px",
                  borderRadius: "16px",
                  background:
                    "linear-gradient(90deg, var(--surface) 25%, var(--surface-hover) 50%, var(--surface) 75%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.5s infinite ease-in-out",
                }}
              />
            ))}
          </div>
        )}

        {/* ── Empty state ────────────────────────────────── */}
        {!loading && filteredTodos.length === 0 && (
          <div
            className="animate-fade-in"
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "var(--text-muted)",
            }}
          >
            <div
              style={{
                fontSize: "48px",
                marginBottom: "16px",
                opacity: 0.4,
              }}
            >
              {filter === "completed" ? "🎯" : filter === "active" ? "🎉" : "📝"}
            </div>
            <p style={{ fontSize: "16px", marginBottom: "6px" }}>
              {filter === "all" && "No tasks yet"}
              {filter === "active" && "All tasks completed!"}
              {filter === "completed" && "No completed tasks"}
            </p>
            <p style={{ fontSize: "13px" }}>
              {filter === "all" && "Click the button above to add your first task."}
              {filter === "active" && "Great job — you're all caught up."}
              {filter === "completed" && "Complete a task to see it here."}
            </p>
          </div>
        )}

        {/* ── Todo list ──────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filteredTodos.map((todo, index) => (
            <div
              key={todo.id}
              className="animate-fade-in-up"
              style={{
                animationDelay: `${index * 40}ms`,
                opacity: 0,
                padding: "16px 18px",
                borderRadius: "16px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                transition: "all 0.2s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--border-hover)";
                e.currentTarget.style.background = "var(--surface-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.background = "var(--surface)";
              }}
            >
              {editingId === todo.id ? (
                /* ── Edit mode ──────────────────────────── */
                <form onSubmit={handleEdit}>
                  <input
                    ref={editTitleRef}
                    id={`edit-title-${todo.id}`}
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 0",
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid var(--border)",
                      color: "var(--text-primary)",
                      fontSize: "15px",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                  />
                  <input
                    id={`edit-desc-${todo.id}`}
                    type="text"
                    placeholder="Description (optional)"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 0",
                      background: "transparent",
                      border: "none",
                      color: "var(--text-secondary)",
                      fontSize: "13px",
                      outline: "none",
                      fontFamily: "inherit",
                      marginTop: "4px",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "8px",
                      marginTop: "12px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={cancelEdit}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        background: "transparent",
                        color: "var(--text-secondary)",
                        fontSize: "13px",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!editTitle.trim()}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        border: "none",
                        background: editTitle.trim()
                          ? "var(--accent)"
                          : "var(--surface-active)",
                        color: editTitle.trim()
                          ? "#fff"
                          : "var(--text-muted)",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: editTitle.trim()
                          ? "pointer"
                          : "not-allowed",
                        fontFamily: "inherit",
                      }}
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                /* ── Display mode ───────────────────────── */
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "14px",
                  }}
                >
                  {/* Checkbox */}
                  <button
                    id={`toggle-${todo.id}`}
                    onClick={() => handleToggle(todo)}
                    style={{
                      width: "22px",
                      height: "22px",
                      minWidth: "22px",
                      borderRadius: "7px",
                      border: todo.completed
                        ? "none"
                        : "2px solid var(--border-hover)",
                      background: todo.completed
                        ? "var(--success)"
                        : "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s ease",
                      marginTop: "2px",
                      boxShadow: todo.completed
                        ? "0 0 12px var(--success-glow)"
                        : "none",
                    }}
                  >
                    {todo.completed && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        style={{ animation: "checkmark 0.2s ease-out" }}
                      >
                        <path
                          d="M2 6L5 9L10 3"
                          stroke="#fff"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: "15px",
                        fontWeight: 500,
                        color: todo.completed
                          ? "var(--text-muted)"
                          : "var(--text-primary)",
                        textDecoration: todo.completed
                          ? "line-through"
                          : "none",
                        transition: "all 0.2s ease",
                        lineHeight: 1.5,
                        wordBreak: "break-word",
                      }}
                    >
                      {todo.title}
                    </p>
                    {todo.description && (
                      <p
                        style={{
                          fontSize: "13px",
                          color: "var(--text-muted)",
                          marginTop: "4px",
                          lineHeight: 1.5,
                          wordBreak: "break-word",
                        }}
                      >
                        {todo.description}
                      </p>
                    )}
                    <p
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        marginTop: "8px",
                        opacity: 0.6,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {new Date(todo.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      display: "flex",
                      gap: "4px",
                      opacity: 0.4,
                      transition: "opacity 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "0.4";
                    }}
                  >
                    <button
                      id={`edit-${todo.id}`}
                      onClick={() => startEdit(todo)}
                      title="Edit"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        border: "none",
                        background: "transparent",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s ease",
                        fontSize: "14px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "var(--surface-active)";
                        e.currentTarget.style.color = "var(--accent)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--text-secondary)";
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M11.5 1.5L14.5 4.5M1 15L1.5 11.5L12.5 0.5L15.5 3.5L4.5 14.5L1 15Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      id={`delete-${todo.id}`}
                      onClick={() => handleDelete(todo.id)}
                      title="Delete"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        border: "none",
                        background: "transparent",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s ease",
                        fontSize: "14px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "var(--danger-glow)";
                        e.currentTarget.style.color = "var(--danger)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--text-secondary)";
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M2 4H14M5 4V2.5C5 1.67 5.67 1 6.5 1H9.5C10.33 1 11 1.67 11 2.5V4M6 7V12M10 7V12M3.5 4L4.5 14C4.5 14.83 5.17 15.5 6 15.5H10C10.83 15.5 11.5 14.83 11.5 14L12.5 4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Footer ─────────────────────────────────────── */}
        {todos.length > 0 && completedCount > 0 && (
          <div
            className="animate-fade-in"
            style={{
              marginTop: "32px",
              paddingTop: "20px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <button
              id="clear-completed-btn"
              onClick={async () => {
                const completed = todos.filter((t) => t.completed);
                setTodos((prev) => prev.filter((t) => !t.completed));
                try {
                  await Promise.all(
                    completed.map((t) => deleteTodo(t.id))
                  );
                } catch {
                  try {
                    const data = await fetchTodos();
                    setTodos(data);
                  } catch {}
                  setError("Failed to clear completed todos");
                }
              }}
              style={{
                padding: "8px 20px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-muted)",
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--danger)";
                e.currentTarget.style.color = "var(--danger)";
                e.currentTarget.style.background = "var(--danger-glow)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              Clear {completedCount} completed
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
