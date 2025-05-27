import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DataTable } from "@/app/protected/admin/data-table";
import { columns } from "@/app/protected/admin/columns";

export default async function AdminPage() {
  const supabase = await createClient();

  // Verificar si el usuario es admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return redirect("/protected");
  }

  // Obtener todos los convenios
  const { data: convenios, error } = await supabase
    .from("convenios")
    .select(`
      *,
      profiles:user_id (
        full_name,
        role
      ),
      convenio_types (
        name
      ),
      observaciones (
        id,
        content,
        created_at,
        resolved
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener convenios:", error);
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-red-500">Error al cargar los convenios</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Administración de Convenios</h1>
      </div>

      <div className="bg-card rounded-lg border shadow-sm">
        <DataTable columns={columns} data={convenios || []} />
      </div>
    </div>
  );
} 