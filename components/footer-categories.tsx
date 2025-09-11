"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getTopLevelServiceCategories } from "@/server/service-category.actions";
import { Skeleton } from "@/components/ui/skeleton";

export const FooterCategories = () => {
  const {
    data: categoriesResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["top-level-service-categories"],
    queryFn: () => getTopLevelServiceCategories(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Loading state with skeletons
  if (isLoading) {
    return (
      <>
        {[1, 2, 3, 4].map((i) => (
          <li key={i}>
            <Skeleton className="h-4 w-24" />
          </li>
        ))}
      </>
    );
  }

  // If error or no data, render nothing
  if (error || !categoriesResponse?.data) {
    return null;
  }

  const categories = categoriesResponse.data;

  return (
    <>
      {categories.map((category) => (
        <li key={category.id}>
          <Link
            href={`/tjenester?categories=${category.id}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {category.name}
          </Link>
        </li>
      ))}
    </>
  );
};
