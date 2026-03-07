'use client'

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchTasks = async () => {
    const { data } = await supabase.from('tasks').select('*');
    setTasks(data || []);
  };

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session) {
        // User is logged in, fetch tasks
        fetchTasks();
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session) {
        fetchTasks();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    // User not logged in
    return (
      <main style={{ padding: '50px', textAlign: 'center' }}>
        <h1>Welcome!</h1>
        <p>Please log in to see your tasks.</p>
        <div style={{ marginTop: '20px' }}>
          <a href="/auth/login">Login</a> | <a href="/auth/signup">Sign Up</a>
        </div>
      </main>
    );
  }

  // User is logged in
  return (
    <main style={{ padding: '50px' }}>
      <div style={{ marginBottom: '20px' }}>
        <p>Logged in as: {user.email}</p>
        <button
          onClick={handleLogout}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>
      <h1>My Tasks</h1>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            {task.title} - {task.completed ? '✅' : '⬜'}
          </li>
        ))}
      </ul>
    </main>
  );
}
