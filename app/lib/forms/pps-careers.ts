export type PpsCareerOption = {
  code: string;
  value: string;
  label: string;
};

export const PPS_CAREER_OPTIONS: PpsCareerOption[] = [
  { code: "IEM", value: "Ingeniería Electromecánica", label: "Ingeniería Electromecánica" },
  { code: "ISI", value: "Ingeniería en Sistemas de Información", label: "Ingeniería en Sistemas de Información" },
  { code: "IQ", value: "Ingeniería Química", label: "Ingeniería Química" },
  { code: "LAR", value: "Licenciatura en Administración Rural", label: "Licenciatura en Administración Rural" },
  { code: "TUL", value: "Tecnicatura Universitaria en Logística", label: "Tecnicatura Universitaria en Logística" },
  { code: "TUM", value: "Tecnicatura Universitaria en Mecatrónica", label: "Tecnicatura Universitaria en Mecatrónica" },
  {
    code: "TUOMRE",
    value: "Tecnicatura Universitaria en Operaciones y Mantenimiento de Redes Eléctricas",
    label: "Tecnicatura Universitaria en Operaciones y Mantenimiento de Redes Eléctricas",
  },
  { code: "TUP", value: "Tecnicatura Universitaria en Programación", label: "Tecnicatura Universitaria en Programación" },
];
