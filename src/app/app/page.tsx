import { Suspense } from "react";
import { CheckForm } from "@/components/check-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function CheckPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
      <CheckForm />
    </Suspense>
  );
}
