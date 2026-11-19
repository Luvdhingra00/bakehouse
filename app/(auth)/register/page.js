"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Cake } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const schema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    email: z.string().trim().email("Enter a valid email"),
    phone: z.string().trim().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

export default function RegisterPage() {
  const router = useRouter();
  const { register: signUp } = useAuth();
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ confirm, ...form }) => {
    setBusy(true);
    try {
      await signUp(form);
      toast.success("Account created. Welcome to BakeHouse!");
      router.push("/shop");
      router.refresh();
    } catch (e) {
      toast.error(e.message);
      setBusy(false);
    }
  };

  const field = (id, label, type = "text", extra = {}) => (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <input id={id} type={type} className="input" {...extra} {...register(id)} />
      {errors[id] && <p className="field-error">{errors[id].message}</p>}
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blush-50 via-cream-50 to-cream-100 px-4 py-10">
      <div className="card w-full max-w-md p-8">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 font-display text-2xl font-bold text-cocoa-900">
          <span className="rounded-full bg-blush-100 p-1.5 text-blush-500"><Cake className="h-5 w-5" /></span> BakeHouse
        </Link>
        <h1 className="mb-1 text-center text-3xl">Create your account</h1>
        <p className="mb-6 text-center text-sm text-cocoa-400">Order fresh bakes in a few taps.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {field("name", "Full name", "text", { autoComplete: "name" })}
          {field("email", "Email", "email", { autoComplete: "email" })}
          {field("phone", "Phone (optional)", "tel", { autoComplete: "tel" })}
          {field("password", "Password", "password", { autoComplete: "new-password" })}
          {field("confirm", "Confirm password", "password", { autoComplete: "new-password" })}
          <button className="btn-primary w-full" disabled={busy}>{busy ? "Creating account..." : "Sign up"}</button>
          <p className="text-center text-sm text-cocoa-400">
            Already have an account? <Link href="/login" className="font-semibold text-blush-500 hover:underline">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
