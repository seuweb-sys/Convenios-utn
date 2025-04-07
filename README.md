
# 🏛️ Convenios UTN

<div align="center">
  
  <h3>Sistema de gestión y seguimiento de convenios institucionales</h3>
  <p>Plataforma digital para la Universidad Tecnológica Nacional que simplifica la creación, gestión y seguimiento de convenios institucionales.</p>

  [![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  
</div>

## ✨ Características principales

- 🔐 **Autenticación segura** con soporte para múltiples proveedores
- 🌓 **Tema oscuro/claro** con transiciones suaves y diseño responsive
- 📊 **Dashboard administrativo** con resumen de actividades y estadísticas
- 📝 **Editor de convenios** con plantillas predefinidas y asistente paso a paso
- 📄 **Generación de documentos** en múltiples formatos (PDF, DOC)
- 🔍 **Búsqueda avanzada** y filtrado de convenios
- 🔔 **Sistema de notificaciones** para seguimiento de convenios



## 🚀 Tecnologías

El proyecto utiliza tecnologías modernas para garantizar rendimiento, escalabilidad y experiencia de usuario superior:

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Interfaz**: React
- **Estilos**: Tailwind CSS
- **Componentes UI**: Shadcn UI
- **Autenticación**: NextAuth.js
- **Base de datos**: Prisma ORM con PostgreSQL
- **Gestión de formularios**: React Hook Form
- **Validación**: Zod
- **Generación de documentos**: React-PDF

## 💻 Instalación y uso

```bash
# Clonar el repositorio
git clone https://github.com/SantiCabrera19/Convenios-UTN.git

# Instalar dependencias
cd Convenios-UTN
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Iniciar el servidor de desarrollo
npm run dev

# Abrir http://localhost:3000 en el navegador
```

## 📂 Estructura del proyecto

```
convenios_utn/
├── app/                   # Estructura de la aplicación (App Router)
│   ├── (auth-pages)/      # Páginas de autenticación
│   ├── protected/         # Páginas protegidas (dashboard, convenios)
│   ├── api/               # API routes y endpoints
│   └── page.tsx           # Página principal
├── components/            # Componentes reutilizables
├── lib/                   # Utilidades y servicios
├── prisma/                # Esquema y migraciones de la base de datos
├── public/                # Archivos estáticos
└── styles/                # Estilos globales
```

## 🌟 Funcionalidades detalladas

### Gestión de convenios
- Creación y edición de convenios con plantillas predefinidas
- Seguimiento de estado y ciclo de vida del convenio
- Control de versiones y historial de cambios
- Asignación de responsables y notificaciones automáticas

### Panel administrativo
- Visualización de estadísticas y métricas clave
- Gestión de usuarios y permisos
- Actividad reciente y convenios pendientes
- Filtros avanzados y búsqueda

### Gestión documental
- Generación de documentos con datos pre-completados
- Vista previa en tiempo real
- Exportación a múltiples formatos
- Almacenamiento seguro de anexos y documentos complementarios

## 📄 Licencia

Este proyecto está licenciado bajo [MIT License](LICENSE).

---

<div align="center">
  <p>Desarrollado para la Universidad Tecnológica Nacional - Facultad Regional Resistencia</p>
  <p>Contacto: <a href="mailto:contacto@example.com">santycabrera150@gmail.com</a></p>
</div>

