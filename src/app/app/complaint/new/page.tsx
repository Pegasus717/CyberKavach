import { Suspense } from "react";
import NewComplaintPage from "./client";
import { Skeleton } from "@/components/ui/skeleton";

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-64 rounded-3xl" />}>
      <NewComplaintPage />
    </Suspense>
  );
}
