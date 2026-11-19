import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";

export const metadata = { title: "Admin — BakeHouse" };

// Server-side guard (middleware also protects this path; API routes re-check roles too)
export default async function AdminLayout({ children }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (session.role !== "admin") redirect("/");
  return <AdminShell admin={{ name: session.name, email: session.email }}>{children}</AdminShell>;
}
