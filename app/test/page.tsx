'use client';

import { useEffect, useState } from 'react';

export default function TestPage() {
  const [convenios, setConvenios] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConvenios();
    fetchUser();
  }, []);

  async function fetchConvenios() {
    setLoading(true);
    try {
      const res = await fetch('/api/convenios');
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error desconocido');
      setConvenios(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setConvenios([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUser() {
    try {
        const res = await fetch('/api/user', {
            method: 'GET',
            credentials: 'include', // <- ¡Esto es clave!
          });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error desconocido');
      setUserData(data);
    } catch (err: any) {
      console.error("Error obteniendo usuario:", err.message);
    }
  }

  async function handleCreateConvenio() {
    const res = await fetch('/api/convenios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Convenio de prueba',
        convenio_type_id: '1', // Asegurate de que exista este ID en tu tabla
        content_data: { ejemplo: 'datos del contenido' },
      }),
    });

    const data = await res.json();
    console.log("Respuesta POST:", data);

    if (!res.ok) {
      alert('Error: ' + data.error);
    } else {
      alert('Convenio creado exitosamente');
      fetchConvenios();
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Test API de Convenios</h1>

      <button
        onClick={handleCreateConvenio}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Crear Convenio (POST)
      </button>

      <section>
        <h2 className="text-xl font-semibold mt-4">Usuario autenticado (GET /api/users)</h2>
        {userData ? (
          <div className="border rounded p-4 bg-gray-50">
            <p><strong>ID:</strong> {userData.id}</p>
            <p><strong>Email:</strong> {userData.email}</p>
            <p><strong>Creado en:</strong> {new Date(userData.created_at).toLocaleString()}</p>
            {/* Mostrar otros datos del perfil si existen */}
            {'full_name' in userData && (
              <p><strong>Nombre:</strong> {userData.full_name}</p>
            )}
          </div>
        ) : (
          <p className="text-gray-500">Cargando datos del usuario...</p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold">Lista de convenios (GET /api/convenios)</h2>
        {loading ? (
          <p>Cargando convenios...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : convenios.length === 0 ? (
          <p>No hay convenios.</p>
        ) : (
          <ul className="space-y-3">
            {convenios.map((c) => (
              <li key={c.id} className="border p-3 rounded shadow-sm">
                <p><strong>Título:</strong> {c.title}</p>
                <p><strong>Tipo:</strong> {c.type}</p>
                <p><strong>Fecha:</strong> {c.date}</p>
                <p><strong>Estado:</strong> {c.status}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}