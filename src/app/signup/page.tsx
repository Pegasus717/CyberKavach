import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function SignupPage() {
  return (
    <Suspense fallback={<Skeleton className="h-80 rounded-3xl" />}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
