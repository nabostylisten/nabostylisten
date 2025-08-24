import { AdminLayout } from "@/components/admin-layout";
import { StylistApplicationDataTable } from "@/components/admin/stylist-application-data-table";

export default function ApplicationsPage() {
  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8 max-w-full">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Søknader fra potensielle stylister
              </h1>
              <p className="text-muted-foreground">
                Gjennomgå og håndter søknader fra potensielle stylister
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-0 w-full">
          <StylistApplicationDataTable />
        </div>
      </div>
    </AdminLayout>
  );
}
