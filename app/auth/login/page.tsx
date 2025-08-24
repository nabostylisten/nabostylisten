import { AuthCard } from "@/components/auth";
import { BlurFade } from "@/components/magicui/blur-fade";

interface PageProps {
  searchParams: Promise<{
    redirectTo?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { redirectTo } = await searchParams;
  
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <BlurFade delay={0.1} duration={0.5} inView>
          <AuthCard
            initialMode="login"
            redirectTo={redirectTo}
          />
        </BlurFade>
      </div>
    </div>
  );
}
