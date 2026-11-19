"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Mail, MapPin, Phone } from "lucide-react";
import { api } from "@/lib/utils";

const schema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().email("Enter a valid email"),
  message: z.string().trim().min(10, "Message must be at least 10 characters"),
});

export default function ContactPage() {
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setBusy(true);
    try {
      await api("/api/contact", { method: "POST", body: data });
      toast.success("Message sent. We'll get back to you soon!");
      reset();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-x py-12">
      <h1 className="text-4xl md:text-5xl">Get in touch</h1>
      <p className="mt-2 text-cocoa-400">Custom cake? Bulk order? Just want to say hi?</p>

      <div className="mt-10 grid gap-8 md:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          {[
            { icon: MapPin, t: "Visit", v: "21 Baker Street, Punjab, India" },
            { icon: Phone, t: "Call", v: "+91 9877983038" },
            { icon: Mail, t: "Email", v: "bakery@bakehouse.com" },
          ].map(({ icon: Icon, t, v }) => (
            <div key={t} className="card flex items-center gap-4 p-5">
              <div className="rounded-full bg-blush-100 p-3 text-blush-500"><Icon className="h-5 w-5" /></div>
              <div><p className="text-sm text-cocoa-400">{t}</p><p className="font-semibold text-cocoa-900">{v}</p></div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-6">
          <div>
            <label className="label" htmlFor="name">Name</label>
            <input id="name" className="input" {...register("name")} />
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" {...register("email")} />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label" htmlFor="message">Message</label>
            <textarea id="message" rows={5} className="input" {...register("message")} />
            {errors.message && <p className="field-error">{errors.message.message}</p>}
          </div>
          <button className="btn-primary" disabled={busy}>{busy ? "Sending..." : "Send message"}</button>
        </form>
      </div>
    </div>
  );
}
