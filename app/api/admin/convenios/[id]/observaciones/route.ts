import { createClient } from "@/utils/supabase/server";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { observaciones } = await request.json();
  if (!observaciones) return NextResponse.json({ error: "Observaciones requeridas" }, { status: 400 });
  const { error, data } = await supabase.from("observaciones").insert({
    convenio_id: params.id,
    user_id: user.id,
    content: observaciones,
    created_at: new Date().toISOString(),
    resolved: false
  }).select().single();
  if (error) return NextResponse.json({ error: "Error creando observación", details: error.message }, { status: 500 });
  return NextResponse.json({ success: true, observacion: data });
} 