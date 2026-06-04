export type ConvenioPrevioFormValue = {
  tipo: string;
  fecha: string;
  objeto: string;
};

export function normalizeConvenioPrevioItem(item: Partial<ConvenioPrevioFormValue> | undefined) {
  return {
    tipo: String(item?.tipo || "").trim(),
    fecha: String(item?.fecha || "").trim(),
    objeto: String(item?.objeto || "").trim(),
  };
}

export function isConvenioPrevioEmpty(item: ConvenioPrevioFormValue) {
  return item.tipo === "" && item.fecha === "" && item.objeto === "";
}

export function normalizeConveniosPreviosForSubmit(items: Array<Partial<ConvenioPrevioFormValue>> | undefined) {
  const normalizedItems = Array.isArray(items) ? items.map(normalizeConvenioPrevioItem) : [];

  if (normalizedItems.length === 0) {
    return [{ tipo: "", fecha: "", objeto: "" }];
  }

  const [first, ...rest] = normalizedItems;
  return [first, ...rest.filter((item) => !isConvenioPrevioEmpty(item))];
}
