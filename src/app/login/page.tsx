import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  return (
    <Suspense fallback={<Skeleton className="h-80 rounded-3xl" />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
