"use client";

import { useEffect, useState } from "react";

import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  user_id: string;
  created_at: string;
};
export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(true);
  const [taskError, setTaskError] = useState<string | null>(null);
  const router = useRouter();

  const fetchTasks = async (currentUser: User) => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false });
    setTasks(data || []);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session) {
        fetchTasks(session.user);
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session) {
        fetchTasks(session.user);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const addTask = async () => {
    if (!newTask.trim() || !user) return;
    const { error } = await supabase
      .from("tasks")
      .insert({ title: newTask, completed: false, user_id: user.id });
    if (error) {
      setTaskError("Failed to add task. Please try again.");
    } else {
      setNewTask("");
      setTaskError(null);
      fetchTasks(user);
    }
  };

  const toggleTask = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from("tasks")
      .update({ completed: !completed })
      .eq("id", id);
    if (!error && user) {
      fetchTasks(user);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  return (
    <main style={{ padding: "50px" }}>
      {" "}
      <div style={{ marginBottom: "20px" }}>
        {" "}
        <p>Logged in as: {user.email}</p>{" "}
        <button
          onClick={handleLogout}
          style={{
            marginTop: "10px",
            padding: "8px 16px",
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {" "}
          Logout{" "}
        </button>{" "}
      </div>{" "}
      <h1>My Tasks</h1> {/* Add Task Form */}{" "}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addTask();
        }}
        style={{ marginBottom: "20px" }}
      >
        {" "}
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task..."
          style={{ padding: "8px", width: "300px", marginRight: "10px" }}
        />{" "}
        <button
          type="submit"
          style={{
            padding: "8px 16px",
            background: "#3ecf8e",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {" "}
          Add Task{" "}
        </button>{" "}
        {taskError && (
          <p style={{ color: "#ef4444", marginTop: "8px" }}>{taskError}</p>
        )}{" "}
      </form>{" "}
      {/* Task List */}{" "}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {" "}
        {tasks.map((task) => (
          <li
            key={task.id}
            style={{
              padding: "10px",
              marginBottom: "10px",
              background: "#f8fafc",
              borderRadius: "5px",
              cursor: "pointer",
            }}
            onClick={() => toggleTask(task.id, task.completed)}
          >
            {" "}
            {task.completed ? "✅" : "⬜"} {task.title}{" "}
          </li>
        ))}{" "}
      </ul>{" "}
    </main>
  );
}
