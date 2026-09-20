// src/Components/PhotoManagerModal.jsx
import React, { useRef, useState } from 'react';
import { Modal, ModalBody } from 'reactstrap';
import { carsApi, photoUrl, MAX_PHOTO_BYTES } from '../services/carsApi';
import './PhotoManagerModal.css';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_MB = Math.round(MAX_PHOTO_BYTES / (1024 * 1024));

const Icon = {
  Close: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Upload: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Plus: (p) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Trash: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Star: ({ filled, ...p }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} {...p}>
      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  Alert: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7.5v6M12 16.6v.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  ),
};

/** Validate a single File and return an error string or null. */
function validateFile(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `"${file.name}" is not a supported image type.`;
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return `"${file.name}" is larger than ${MAX_MB}MB.`;
  }
  return null;
}

export default function PhotoManagerModal({ car, onClose, onUpdated }) {
  // Already-uploaded photos (server)
  const [serverPhotos, setServerPhotos] = useState(
    Array.isArray(car.photos) ? car.photos : []
  );

  // Local files staged for upload (preview only, nothing sent yet)
  const [staged, setStaged] = useState([]); // [{ id, file, previewUrl }]

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const openFilePicker = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const addFiles = (files) => {
    const list = Array.from(files || []);
    if (list.length === 0) return;

    setError('');

    const accepted = [];
    for (const file of list) {
      const msg = validateFile(file);
      if (msg) {
        setError(msg);
        continue;
      }
      accepted.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (accepted.length > 0) {
      setStaged((prev) => [...prev, ...accepted]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleInputChange = (e) => addFiles(e.target.files);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploading) return;
    addFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeStaged = (id) => {
    setStaged((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const clearAllStaged = () => {
    staged.forEach((s) => URL.revokeObjectURL(s.previewUrl));
    setStaged([]);
    setError('');
  };

  const handleUploadAll = async () => {
    if (staged.length === 0) return;

    setUploading(true);
    setError('');
    setProgress({ current: 0, total: staged.length });

    const hasPrimaryOnServer = serverPhotos.some((p) => p.is_primary);

    let updatedPhotos = serverPhotos;
    let uploadedCount = 0;

    try {
      for (let i = 0; i < staged.length; i++) {
        const item = staged[i];
        // Only the very first photo (across server + staged) becomes primary
        const isPrimary = !hasPrimaryOnServer && uploadedCount === 0;

        const updatedCar = await carsApi.uploadPhoto(car.id, item.file, isPrimary);

        if (Array.isArray(updatedCar?.photos)) {
          updatedPhotos = updatedCar.photos;
          setServerPhotos(updatedPhotos);
        }
        uploadedCount++;

        // Remove this item from staging on success
        setStaged((prev) => {
          const item2 = prev.find((p) => p.id === item.id);
          if (item2) URL.revokeObjectURL(item2.previewUrl);
          return prev.filter((p) => p.id !== item.id);
        });
        setProgress({ current: i + 1, total: staged.length });
      }

      // Push the final set of photos up
      onUpdated({ ...car, photos: updatedPhotos });
    } catch (err) {
      console.error('[upload photos] failed:', err);
      setError(err.message || 'Failed to upload some photos. Please try again.');
    } finally {
      setUploading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const closeIfSafe = () => {
    if (uploading) return;
    // revoke any staged previews
    staged.forEach((s) => URL.revokeObjectURL(s.previewUrl));
    onClose();
  };

  const hasStaged = staged.length > 0;
  const totalCount = serverPhotos.length + staged.length;

  return (
    <Modal
      isOpen
      centered
      toggle={closeIfSafe}
      className="photo_manager_modal"
      backdrop="static"
      size="lg"
    >
      <ModalBody className="photo_manager_body">
        <button className="photo_manager_close" onClick={closeIfSafe} aria-label="Close">
          <Icon.Close />
        </button>

        <h3 className="photo_manager_title">Car photos</h3>
        <p className="photo_manager_subtitle">
          {car.make} {car.model} · {car.plate_number}
        </p>

        {error && (
          <div className="photo_manager_alert">
            <Icon.Alert />
            <span>{error}</span>
          </div>
        )}

        {/* ---------- Uploaded photos (from server) ---------- */}
        {serverPhotos.length > 0 && (
          <>
            <div className="photo_grid_header">
              <span>Uploaded ({serverPhotos.length})</span>
              <span className="photo_grid_hint">The starred photo appears on your car card</span>
            </div>
            <div className="photo_grid">
              {serverPhotos.map((photo) => {
                const url = photoUrl(photo);
                return (
                  <div
                    key={photo.id}
                    className={`photo_tile ${photo.is_primary ? 'is_primary' : ''}`}
                  >
                    {url ? <img src={url} alt="" /> : <div className="photo_tile_fallback" />}
                    {photo.is_primary && (
                      <span className="photo_primary_badge">
                        <Icon.Star filled />
                        Primary
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ---------- Staged (not uploaded yet) ---------- */}
        {hasStaged && (
          <>
            <div className="photo_grid_header">
              <span>Ready to upload ({staged.length})</span>
              <button
                type="button"
                className="photo_clear_btn"
                onClick={clearAllStaged}
                disabled={uploading}
              >
                Clear all
              </button>
            </div>
            <div className="photo_grid">
              {staged.map((item) => (
                <div key={item.id} className="photo_tile is_staged">
                  <img src={item.previewUrl} alt="" />
                  <button
                    type="button"
                    className="photo_remove_btn"
                    onClick={() => removeStaged(item.id)}
                    disabled={uploading}
                    title="Remove"
                    aria-label="Remove"
                  >
                    <Icon.Trash />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ---------- Dropzone / Add ---------- */}
        <div
          className={`photo_dropzone ${uploading ? 'is_disabled' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={openFilePicker}
          role="button"
          tabIndex={0}
          aria-disabled={uploading}
        >
          <div className="photo_dropzone_icon">
            {hasStaged ? <Icon.Plus /> : <Icon.Upload />}
          </div>
          <p className="photo_dropzone_title">
            {hasStaged
              ? 'Add more photos'
              : 'Click to add photos, or drag and drop'}
          </p>
          <p className="photo_dropzone_hint">
            JPG, PNG or WebP · Max {MAX_MB}MB each
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            multiple
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />
        </div>

        {totalCount === 0 && (
          <p className="photo_empty">No photos yet. Add some above, then click Upload.</p>
        )}

        {/* ---------- Footer ---------- */}
        <div className="photo_manager_actions">
          <button
            type="button"
            className="photo_manager_btn"
            onClick={closeIfSafe}
            disabled={uploading}
          >
            {hasStaged ? 'Cancel' : 'Done'}
          </button>

          {hasStaged && (
            <button
              type="button"
              className="photo_manager_btn primary"
              onClick={handleUploadAll}
              disabled={uploading}
            >
              {uploading
                ? `Uploading ${progress.current}/${progress.total}…`
                : `Upload ${staged.length} photo${staged.length !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}