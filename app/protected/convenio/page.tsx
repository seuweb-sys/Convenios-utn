import { Button } from "@/app/components/ui/button";
import { getConvenioTypes } from "@/app/lib/dashboard/get-convenio-types";
import { DownloadButton } from "./download-button";

export default async function ConvenioPage() {
  const convenioTypes = await getConvenioTypes();

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Convenios</h1>
        <DownloadButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {convenioTypes.map((type) => (
          <div key={type.id} className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              {type.icon}
              <h3 className="font-semibold">{type.title}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">{type.description}</p>
            <Button variant="outline" className="w-full">
              Ver Detalles
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
} 