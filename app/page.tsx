"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "./logout-button";
import type {
  CreateTodoRequestBody,
  CreateTodoResponse,
  GetTodosResponse,
  TodoDto,
} from "./api/todos/route";
import type {
  UpdateTodoRequestBody,
  UpdateTodoResponse,
} from "./api/todos/[id]/route";

export default function Home() {
  const [email, setEmail] = useState<string | null>(null);
  const [todos, setTodos] = useState<TodoDto[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    const saved = window.localStorage.getItem("theme");
    return saved === "light" || saved === "dark" ? saved : "dark";
  });
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  useEffect(() => {
    void loadTodos();
  }, []);

  // テーマの変更を <html> クラスと localStorage に反映する
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const sortedTodos = useMemo(() => {
    const sorted = [...todos].sort(
      (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
    );
    return sortOrder === "asc" ? sorted : sorted.reverse();
  }, [todos, sortOrder]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  function toggleSortOrder() {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  }

  async function loadTodos() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/todos");
      if (!res.ok) throw new Error("failed to load todos");
      const data = (await res.json()) as GetTodosResponse;
      setTodos(data.todos);
    } catch {
      setError("TODO の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    setSubmitting(true);
    setError(null);
    try {
      const requestBody: CreateTodoRequestBody = { title };
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (!res.ok) throw new Error("failed to create todo");
      const data = (await res.json()) as CreateTodoResponse;
      setTodos((prev) => [data.todo, ...prev]);
      setNewTitle("");
    } catch {
      setError("TODO の追加に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(todo: TodoDto) {
    const nextCompleted = !todo.isCompleted;
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todo.id ? { ...t, isCompleted: nextCompleted } : t,
      ),
    );

    try {
      const requestBody: UpdateTodoRequestBody = {
        isCompleted: nextCompleted,
      };
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (!res.ok) throw new Error("failed to update todo");
      const data = (await res.json()) as UpdateTodoResponse;
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? data.todo : t)));
    } catch {
      setTodos((prev) =>
        prev.map((t) =>
          t.id === todo.id ? { ...t, isCompleted: todo.isCompleted } : t,
        ),
      );
      setError("TODO の更新に失敗しました。");
    }
  }

  async function handleDelete(id: string) {
    const previous = todos;
    setTodos((prev) => prev.filter((t) => t.id !== id));

    try {
      const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed to delete todo");
    } catch {
      setTodos(previous);
      setError("TODO の削除に失敗しました。");
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-white text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 sm:px-6 dark:border-zinc-800">
        <h1 className="text-lg font-semibold">My TODO App</h1>
        <div className="flex items-center gap-3">
          <span className="hidden truncate text-sm text-zinc-500 sm:inline dark:text-zinc-400">
            {email}
          </span>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="テーマを切り替える"
            suppressHydrationWarning
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {theme === "dark" ? "☀️ ライトモード" : "🌙 ダークモード"}
          </button>
          <LogoutButton />
        </div>
      </header>

      <main className="flex flex-1 justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-zinc-50 p-6 shadow-xl sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="やることを入力..."
              className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
            <button
              type="submit"
              disabled={submitting || !newTitle.trim()}
              className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              追加
            </button>
          </form>

          {error && (
            <p className="mt-4 text-sm text-red-500 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {todos.length} 件のTODO
            </span>
            <button
              type="button"
              onClick={toggleSortOrder}
              className="rounded-lg border border-zinc-300 px-3 py-1 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {sortOrder === "desc" ? "新しい順" : "古い順"}
            </button>
          </div>

          <ul className="mt-3 flex flex-col gap-2">
            {loading && <li className="text-sm text-zinc-500">読み込み中...</li>}
            {!loading && sortedTodos.length === 0 && (
              <li className="text-sm text-zinc-500">TODO はまだありません。</li>
            )}
            {sortedTodos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-100/50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-800/50"
              >
                <input
                  type="checkbox"
                  checked={todo.isCompleted}
                  onChange={() => handleToggle(todo)}
                  className="h-4 w-4 shrink-0 accent-indigo-600"
                />
                <span
                  className={
                    todo.isCompleted
                      ? "min-w-0 flex-1 truncate text-zinc-500 line-through"
                      : "min-w-0 flex-1 truncate text-zinc-900 dark:text-zinc-100"
                  }
                >
                  {todo.title}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(todo.id)}
                  className="shrink-0 text-sm text-zinc-500 transition-colors hover:text-red-500 dark:hover:text-red-400"
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
