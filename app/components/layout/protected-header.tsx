import Image from "next/image";
import Link from "next/link";
import { MenuIcon } from "lucide-react";

import { signOutAction } from "@/app/actions";
import { Button } from "@/app/components/ui/button";
import { NotificationsDropdown } from "@/app/components/layout/notifications";

type ProtectedHeaderUser = {
  id: string;
  email?: string | null;
};

type ProtectedHeaderProfile = {
  avatar_url?: string | null;
  full_name?: string | null;
  role?: string | null;
} | null;

export function ProtectedHeader({
  user,
  profile,
  showNotifications = true,
}: {
  user: ProtectedHeaderUser;
  profile: ProtectedHeaderProfile;
  showNotifications?: boolean;
}) {
  const displayName = profile?.full_name || user.email?.split("@")[0];

  return (
    <header className="border-b bg-card shadow-sm sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-4">
          <Link href="/protected" className="flex items-center gap-2">
            <div className="bg-white rounded-xl shadow-lg relative overflow-hidden w-[60px] h-[60px] flex items-center justify-center border border-gray-200">
              <Image
                src="/utn-logo.png"
                alt="UTN Logo"
                width={50}
                height={40}
                className="w-[50px] h-[40px] object-contain"
                priority
                style={{
                  width: "50px",
                  height: "40px",
                  objectFit: "contain",
                }}
              />
            </div>
            <span className="font-semibold text-xl hidden md:inline-block">Convenios UTN</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {showNotifications && <NotificationsDropdown userId={user.id} />}

          <div className="flex items-center gap-3 border-l pl-3 ml-1">
            <div className="hidden md:block text-right">
              <div className="text-sm font-medium">{displayName}</div>
              <div className="text-xs text-muted-foreground capitalize">{profile?.role || "Usuario"}</div>
            </div>

            <div className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium text-sm overflow-hidden">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={displayName || "Usuario"}
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                />
              ) : user.email ? (
                user.email[0].toUpperCase()
              ) : (
                "U"
              )}
            </div>

            <form action={signOutAction} className="hidden md:block">
              <Button variant="outline" size="sm" type="submit" className="text-xs h-8">
                Cerrar sesión
              </Button>
            </form>

            <button className="md:hidden p-1">
              <MenuIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
