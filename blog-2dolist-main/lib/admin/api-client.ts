export class AdminApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
    this.details = details;
  }
}

export type AdminImageUploadContext = 'editor' | 'cover';

export interface AdminUploadedImage {
  id: string;
  url: string;
  mimeType?: string;
  source?: string;
  storageKey?: string;
}

const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;

const mapStatusMessage = (status: number, fallback: string) => {
  if (status === 400) return 'Requête invalide. Vérifiez les champs saisis.';
  if (status === 401) return 'Session admin expirée. Reconnectez-vous.';
  if (status === 403) return 'Action refusée pour ce compte admin.';
  if (status === 413) return 'Image trop lourde. Réduisez la taille du fichier puis réessayez.';
  if (status === 415) return 'Type de fichier refusé. Utilisez une image valide.';
  if (status === 503) return 'Backend admin indisponible. Vérifiez NEXT_PUBLIC_API_URL/API_BASE_URL.';
  if (status >= 500) return 'Erreur serveur. Réessayez dans quelques instants.';
  return fallback;
};

const getPayloadMessage = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') return undefined;
  const candidate = payload as { message?: unknown; error?: unknown };
  return typeof candidate.message === 'string'
    ? candidate.message
    : typeof candidate.error === 'string'
      ? candidate.error
      : undefined;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    cache: 'no-store'
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const fallback = getPayloadMessage(payload) ?? 'Erreur API.';
    throw new AdminApiError(mapStatusMessage(response.status, fallback), response.status, payload);
  }

  return payload as T;
}

const assertUploadableImage = (file: File) => {
  if (!file) throw new AdminApiError('Aucun fichier image sélectionné.', 400);
  if (!file.type.startsWith('image/')) throw new AdminApiError('Type de fichier refusé. Sélectionnez une image.', 415);
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new AdminApiError('Image trop lourde. La taille maximale autorisée côté frontend est de 10 Mo.', 413);
  }
};

const parseUploadedImage = (payload: unknown): AdminUploadedImage => {
  const data = payload && typeof payload === 'object' ? (payload as { data?: unknown }).data : undefined;
  const image = data && typeof data === 'object' ? (data as Partial<AdminUploadedImage>) : undefined;

  if (!image || typeof image.url !== 'string' || !image.url.trim() || typeof image.id !== 'string' || !image.id.trim()) {
    throw new AdminApiError('Réponse upload invalide: le backend doit retourner data.id et data.url.', 502, payload);
  }

  return {
    id: image.id,
    url: image.url,
    mimeType: typeof image.mimeType === 'string' ? image.mimeType : undefined,
    source: typeof image.source === 'string' ? image.source : undefined,
    storageKey: typeof image.storageKey === 'string' ? image.storageKey : undefined
  };
};

export async function uploadAdminImage(file: File, context: AdminImageUploadContext): Promise<AdminUploadedImage> {
  assertUploadableImage(file);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('context', context);

  const response = await fetch('/admin-api/media/upload', {
    method: 'POST',
    body: formData,
    cache: 'no-store'
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const fallback = getPayloadMessage(payload) ?? 'Upload image impossible.';
    throw new AdminApiError(mapStatusMessage(response.status, fallback), response.status, payload);
  }

  return parseUploadedImage(payload);
}

export const adminApi = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' })
};
