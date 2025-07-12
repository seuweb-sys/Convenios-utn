import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/convenio-types/[name]
// Acepta un nombre de tipo de convenio (ej: "convenio-marco") y devuelve su ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const name = params.id.replace(/-/g, ' ') // Convertir slug a nombre con espacios

    const { data, error } = await supabase
      .from('convenio_types')
      .select('id, name')
      .ilike('name', `%${name}%`) // Búsqueda flexible por nombre
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: `Tipo de convenio no encontrado para: ${name}` },
          { status: 404 }
        )
      }
      throw error
    }

    if (!data) {
      return NextResponse.json(
        { error: `Tipo de convenio no encontrado para: ${name}` },
        { status: 404 }
      )
    }

    return NextResponse.json({ id: data.id, name: data.name })
  } catch (error: any) {
    console.error('Error al obtener tipo de convenio por nombre:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
} 