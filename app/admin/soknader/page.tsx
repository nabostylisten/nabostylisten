import { AdminLayout } from "@/components/admin-layout";
import { StylistApplicationDataTable } from "@/components/admin/stylist-application-data-table";

export default function ApplicationsPage() {
  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Søknader fra potensielle stylister
          </h1>
          <p className="text-muted-foreground">
            Gjennomgå og håndter søknader fra potensielle stylister
          </p>
        </div>

        <StylistApplicationDataTable />
      </div>
    </AdminLayout>
  );
}
