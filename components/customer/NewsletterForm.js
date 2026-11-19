"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/utils";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/newsletter", { method: "POST", body: { email } });
      toast.success("You're on the list. Sweet!");
      setEmail("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="input !rounded-full !bg-white"
      />
      <button className="btn-primary shrink-0" disabled={busy}>
        <Send className="h-4 w-4" /> {busy ? "Joining..." : "Subscribe"}
      </button>
    </form>
  );
}
