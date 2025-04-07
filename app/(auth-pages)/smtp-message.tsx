import { InfoIcon } from "lucide-react";

export const SmtpMessage = () => {
  return (
    <div className="text-sm max-w-md text-foreground w-full p-4 mt-6 rounded-md border">
      <div className="bg-accent text-foreground text-sm p-3 rounded-md flex gap-3 items-center mb-4">
        <InfoIcon size="16" strokeWidth={2} />
        <div>
          <p className="flex-1">
            Para el propósito de este demo, las contraseñas y los correos
            electrónicos no están verificados.
          </p>
        </div>
      </div>
      <div className="px-2">
        <p>
          Si estuvieras usando un servidor SMTP, se enviaría un enlace de
          verificación al registrarte. En este momento, puedes simplemente
          iniciar sesión con el correo electrónico y la contraseña que acabas de
          proporcionar.
        </p>
      </div>
    </div>
  );
};
