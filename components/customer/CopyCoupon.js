"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import toast from "react-hot-toast";

export default function CopyCoupon({ code }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(`${code} copied!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Please select the code and copy it manually.");
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="mt-4 inline-flex items-center gap-2 rounded-full border border-dashed border-cocoa-400 px-3 py-1 text-xs font-semibold text-cocoa-500 transition hover:border-blush-500 hover:bg-white hover:text-blush-500"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : `Use code ${code}`}
    </button>
  );
}