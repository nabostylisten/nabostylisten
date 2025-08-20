import { AuthCard } from "@/components/auth";

interface PageProps {
  searchParams: {
    redirectTo?: string;
  };
}

export default function Page({ searchParams }: PageProps) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <AuthCard
          initialMode="login"
          redirectTo={searchParams.redirectTo}
        />
      </div>
    </div>
  );
}
