// src/services/carsApi.js
const API_BASE = 'https://api.wenyfour.com.ng';

// Max upload size — keep under 4MB to avoid 413 from most proxies (nginx default is 1MB, so you may need backend config)
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

export function getAuthToken() {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('auth_token') ||
    ''
  );
}

/** Resolve a photo_url into a fully-qualified URL the browser can load. */
export function resolvePhotoUrl(photoUrl) {
  if (!photoUrl) return '';
  // Already absolute?
  if (/^https?:\/\//i.test(photoUrl)) return photoUrl;
  // Already rooted with a path?
  if (photoUrl.startsWith('/')) {
    // If backend serves photos off the API domain:
    return `${API_BASE}${photoUrl}`;
  }
  // Bare filename → assume it's under a photos path on the API.
  // Adjust this path once you know the real S3/CDN prefix.
  return `${API_BASE}/photos/${photoUrl}`;
}

/** Pick the best photo URL from a photo object (handles several common shapes). */
export function photoUrl(photo) {
  if (!photo) return '';
  return resolvePhotoUrl(
    photo.photo_url ||
    photo.url ||
    photo.path ||
    photo.filename ||
    ''
  );
}

async function handleResponse(res) {
  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      if (Array.isArray(body?.detail)) {
        detail = body.detail.map((d) => `${d.loc?.join('.')}: ${d.msg}`).join('; ');
      } else if (typeof body?.detail === 'string') {
        detail = body.detail;
      }
    } catch { /* ignore */ }

    if (res.status === 401 || res.status === 403) {
      throw new Error('Your session has expired. Please sign in again.');
    }
    if (res.status === 413) {
      throw new Error('That image is too large. Please use a photo under 4MB.');
    }
    throw new Error(detail || `Request failed with ${res.status}`);
  }
  return res.json();
}

export const carsApi = {
  async list() {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/cars/my-cars`, {
      headers: { accept: 'application/json', Authorization: `Bearer ${token}` },
    });
    const data = await handleResponse(res);
    return Array.isArray(data) ? data : [];
  },

  async create(payload) {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/cars/`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async update(carId, payload) {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/cars/${carId}`, {
      method: 'PATCH',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async remove(carId) {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/cars/${carId}`, {
      method: 'DELETE',
      headers: { accept: 'application/json', Authorization: `Bearer ${token}` },
    });
    if (res.status === 204) return true;
    if (!res.ok) {
      let detail = '';
      try {
        const body = await res.json();
        if (typeof body?.detail === 'string') detail = body.detail;
        else if (Array.isArray(body?.detail)) detail = body.detail.map((d) => d.msg).join('; ');
      } catch { /* ignore */ }
      if (res.status === 401 || res.status === 403) {
        throw new Error('Your session has expired. Please sign in again.');
      }
      throw new Error(detail || `Request failed with ${res.status}`);
    }
    return true;
  },

  async uploadPhoto(carId, file, isPrimary = false) {
    const token = getAuthToken();
    const fd = new FormData();
    fd.append('file', file);

    const url = `${API_BASE}/cars/${carId}/photos?is_primary=${isPrimary ? 'true' : 'false'}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { accept: 'application/json', Authorization: `Bearer ${token}` },
      body: fd,
    });
    return handleResponse(res);
  },

  // If your backend supports deleting / promoting photos later, add them here.
  // async removePhoto(carId, photoId) { ... }
  // async setPrimaryPhoto(carId, photoId) { ... }
};