import { AuthCard } from "@/components/auth";
import { BlurFade } from "@/components/magicui/blur-fade";

interface PageProps {
  searchParams: {
    redirectTo?: string;
  };
}

export default function Page({ searchParams }: PageProps) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <BlurFade delay={0.1} duration={0.5} inView>
          <AuthCard
            initialMode="signup"
            redirectTo={searchParams.redirectTo}
          />
        </BlurFade>
      </div>
    </div>
  );
}
