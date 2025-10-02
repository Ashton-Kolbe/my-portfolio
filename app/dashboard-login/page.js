"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function DashboardLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) return setError(loginError.message);
    router.push("/dashboard");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#CAD2C5]">
      <form
        onSubmit={handleLogin}
        autoComplete="off"
        className="bg-[#84A98C] p-8 rounded shadow-lg flex flex-col gap-4 w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold text-[#2F3E46] text-center">Dashboard Login</h1>

        <input
          type="email"
          name="email"
          autoComplete="off"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-2 rounded border border-[#52796F]"
        />

        <input
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 rounded border border-[#52796F]"
        />

        {error && <p className="text-red-600">{error}</p>}

        <button
          type="submit"
          className="bg-[#52796F] text-[#CAD2C5] p-2 rounded hover:bg-[#354F52] transition"
        >
          Login
        </button>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-2 bg-[#354F52] text-[#CAD2C5] p-2 rounded hover:bg-[#52796F] transition"
        >
          Back to Website
        </button>
      </form>
    </div>
  );
}
