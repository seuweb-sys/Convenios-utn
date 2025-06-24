import { createClient } from "@/utils/supabase/server";
import { NextResponse, NextRequest } from "next/server";
import { sendCorrectionRequestEmail } from '@/app/lib/services/email-service';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { subject, message } = await request.json();
  // Buscar el convenio y el usuario dueño
  const { data: convenio, error: convenioError } = await supabase
    .from("convenios")
    .select("title, user_id, convenio_type_id, convenio_types(name)")
    .eq("id", params.id)
    .single();
  if (convenioError || !convenio) return NextResponse.json({ error: "Convenio no encontrado" }, { status: 404 });
  // Buscar email del usuario dueño
  let userEmail = null;
  let userName = null;
  try {
    const { createClient: createSupabaseAdminClient } = await import('@supabase/supabase-js');
    const adminClient = createSupabaseAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: userAuth } = await adminClient.auth.admin.getUserById(convenio.user_id);
    userEmail = userAuth?.user?.email;
  } catch (e) {
    return NextResponse.json({ error: "No se pudo obtener el email del usuario" }, { status: 500 });
  }
  // Buscar nombre del usuario
  const { data: userProfile } = await supabase.from('profiles').select('full_name').eq('id', convenio.user_id).single();
  userName = userProfile?.full_name || 'Usuario';
  if (!userEmail) {
    return NextResponse.json({ error: "No se pudo obtener el email del usuario" }, { status: 500 });
  }
  // Mapear el nombre del tipo a slug aceptado por front
  const mapNameToSlug = (name: string | null): string => {
    if (!name) return 'marco';
    const normalize = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const n = normalize(name.toLowerCase());
    if (n.includes('marco') && n.includes('practica')) return 'practica-marco';
    if (n.includes('marco')) return 'marco';
    if (n.includes('especifico')) return 'especifico';
    if (n.includes('particular')) return 'particular';
    if (n.includes('acuerdo')) return 'acuerdo';
    return 'marco';
  };
  const typeSlug = mapNameToSlug((convenio as any)?.convenio_types?.name ?? null);

  try {
    await sendCorrectionRequestEmail({
      userEmail: userEmail!,
      userName: userName || 'Usuario',
      convenioTitle: convenio.title,
      convenioId: params.id,
      typeSlug,
      observaciones: message,
      adminName: profile.full_name || 'Administrador'
    });
    return NextResponse.json({ success: true });
  } catch (emailError) {
    return NextResponse.json({ error: "Error enviando email", details: String(emailError) }, { status: 500 });
  }
} 