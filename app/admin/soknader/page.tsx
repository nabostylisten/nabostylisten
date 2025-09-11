import { AdminLayout } from "@/components/admin-layout";
import { StylistApplicationDataTable } from "@/components/admin/stylist-application-data-table";
import { BlurFade } from "@/components/magicui/blur-fade";

export default function ApplicationsPage() {
  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-12">
        <BlurFade delay={0.1} duration={0.5} inView>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Søknader fra potensielle stylister
            </h1>
            <p className="text-muted-foreground">
              Gjennomgå og håndter søknader fra potensielle stylister
            </p>
          </div>
        </BlurFade>

        <BlurFade delay={0.15} duration={0.5} inView>
          <StylistApplicationDataTable />
        </BlurFade>
      </div>
    </AdminLayout>
  );
}
