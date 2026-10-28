// ============================================================
// Nuba Ops — Compresión de fotos antes de subirlas
// ============================================================
// El fallo típico de subida en móvil es mandar 4-6 MB de foto
// con mala cobertura. Aquí se reduce a ~200 KB y se corrige la
// orientación antes de tocar la red. Si el navegador no sabe
// leer el archivo (HEIC de iPhone), se devuelve el original.
// ============================================================

const MAX_LADO = 1600;
const CALIDAD = 0.82;

export async function prepararImagen(file) {
  if (!file) throw new Error("No hay archivo");
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo no es una imagen");
  }
  if (file.size > 25 * 1024 * 1024) {
    throw new Error("La foto es demasiado grande (máximo 25 MB)");
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      return { blob: file, dataUrl: null, original: true, ancho: null, alto: null };
    }
  }

  const escala = Math.min(1, MAX_LADO / Math.max(bitmap.width, bitmap.height));
  const ancho = Math.round(bitmap.width * escala);
  const alto = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.drawImage(bitmap, 0, 0, ancho, alto);
  bitmap.close?.();

  const blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", CALIDAD)
  );

  if (!blob) {
    return { blob: file, dataUrl: canvas.toDataURL("image/jpeg", 0.6), original: true, ancho, alto };
  }

  const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
  return { blob, dataUrl, original: false, ancho, alto };
}

export function tamanoLegible(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
