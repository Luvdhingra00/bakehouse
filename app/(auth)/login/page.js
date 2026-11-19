"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Cake } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const { login } = useAuth();
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email, password }) => {
    setBusy(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      // Only follow same-site relative redirects
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      router.push(user.role === "admin" ? safeNext || "/admin" : safeNext && !safeNext.startsWith("/admin") ? safeNext : "/");
      router.refresh();
    } catch (e) {
      toast.error(e.message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" className="input" {...register("email")} />
        {errors.email && <p className="field-error">{errors.email.message}</p>}
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" type="password" autoComplete="current-password" className="input" {...register("password")} />
        {errors.password && <p className="field-error">{errors.password.message}</p>}
      </div>
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Logging in..." : "Log in"}</button>
      <p className="text-center text-sm text-cocoa-400">
        New to BakeHouse? <Link href="/register" className="font-semibold text-blush-500 hover:underline">Create an account</Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blush-50 via-cream-50 to-cream-100 px-4 py-10">
      <div className="card w-full max-w-md p-8">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 font-display text-2xl font-bold text-cocoa-900">
          <span className="rounded-full bg-blush-100 p-1.5 text-blush-500"><Cake className="h-5 w-5" /></span> BakeHouse
        </Link>
        <h1 className="mb-1 text-center text-3xl">Welcome back</h1>
        <p className="mb-6 text-center text-sm text-cocoa-400">Log in to order or manage the bakery.</p>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
