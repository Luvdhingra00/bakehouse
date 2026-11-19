"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { PageLoader } from "@/components/ui/States";
import { Panel } from "@/components/admin/ui";
import { api } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export default function AdminSettings() {
  const { user, refresh } = useAuth();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (user) {
      reset({ name: user.name, phone: user.phone || "", address: user.address || "" });
      setReady(true);
    }
  }, [user, reset]);

  const onSubmit = async (form) => {
    try {
      await api("/api/auth/me", { method: "PUT", body: form });
      await refresh();
      toast.success("Profile saved");
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!ready) return <PageLoader />;

  return (
    <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
      <Panel title="Admin profile">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" {...register("name", { required: true, minLength: 2 })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input opacity-60" value={user.email} disabled readOnly />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" {...register("phone")} />
          </div>
          <div>
            <label className="label">Address</label>
            <textarea rows={2} className="input" {...register("address")} />
          </div>
          <button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save profile"}</button>
        </form>
      </Panel>

      <Panel title="Store information">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between"><dt className="text-cocoa-400">Store name</dt><dd className="font-medium">BakeHouse</dd></div>
          <div className="flex justify-between"><dt className="text-cocoa-400">Currency</dt><dd className="font-medium">Indian Rupee (₹)</dd></div>
          <div className="flex justify-between"><dt className="text-cocoa-400">Payment methods</dt><dd className="font-medium">Cash on Delivery</dd></div>
          <div className="flex justify-between"><dt className="text-cocoa-400">Image uploads</dt><dd className="font-medium">Cloudinary (optional)</dd></div>
        </dl>
        <p className="mt-6 rounded-2xl bg-cream-50 p-4 text-xs text-cocoa-500">
          To change the admin password, update <code>ADMIN_PASSWORD</code> in <code>.env.local</code> and run <code>npm run seed</code> again.
        </p>
      </Panel>
    </div>
  );
}
