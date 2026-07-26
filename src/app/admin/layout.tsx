export const metadata = {
  title: { template: '%s | Admin', default: 'Admin' },
  robots: { index: false, follow: false }, // nunca indexar el panel
}

// Layout raíz de /admin: solo metadata y contenedor.
// El guard de autenticación vive en (protected)/layout.tsx para que
// NO se aplique a /admin/login (evita el bucle de redirección).
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#0a0a0a]">{children}</div>
}
//test
