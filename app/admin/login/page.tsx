import { Suspense } from "react";
import LoginForm from "@/components/admin/LoginForm";

export const metadata = { title: "Admin — Design Wave" };

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-5">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
