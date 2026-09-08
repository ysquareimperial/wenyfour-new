// src/Components/AvatarCropper.jsx
import React, { useEffect, useRef, useState } from "react";
import "./AvatarCropper.css";

const VIEWPORT_SIZE = 260; // on-screen crop box, px
const OUTPUT_SIZE = 512; // exported square image, px

// A minimal, dependency-free square image cropper:
// - drag to reposition
// - slider to zoom in/out
// - "Use Photo" exports a square JPEG Blob via canvas
export default function AvatarCropper({ imageSrc, onCancel, onSave }) {
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const imgRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setNatural({ width: img.naturalWidth, height: img.naturalHeight });
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const baseScale =
    natural.width && natural.height
      ? Math.max(VIEWPORT_SIZE / natural.width, VIEWPORT_SIZE / natural.height)
      : 1;
  const scale = baseScale * zoom;
  const displayWidth = natural.width * scale;
  const displayHeight = natural.height * scale;

  const clamp = (x, y, currentScale) => {
    const w = natural.width * currentScale;
    const h = natural.height * currentScale;
    const maxX = Math.max(0, (w - VIEWPORT_SIZE) / 2);
    const maxY = Math.max(0, (h - VIEWPORT_SIZE) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  };

  const pointFromEvent = (e) => ("touches" in e ? e.touches[0] : e);

  const handleDragStart = (e) => {
    const p = pointFromEvent(e);
    dragRef.current = { startX: p.clientX, startY: p.clientY, origin: offset };
  };

  const handleDragMove = (e) => {
    if (!dragRef.current) return;
    const p = pointFromEvent(e);
    const dx = p.clientX - dragRef.current.startX;
    const dy = p.clientY - dragRef.current.startY;
    setOffset(clamp(dragRef.current.origin.x + dx, dragRef.current.origin.y + dy, scale));
  };

  const handleDragEnd = () => {
    dragRef.current = null;
  };

  const handleZoomChange = (e) => {
    const nextZoom = Number(e.target.value);
    setZoom(nextZoom);
    setOffset((prev) => clamp(prev.x, prev.y, baseScale * nextZoom));
  };

  const handleSave = () => {
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    const outputScale = OUTPUT_SIZE / VIEWPORT_SIZE;

    const drawWidth = displayWidth * outputScale;
    const drawHeight = displayHeight * outputScale;
    const drawX = (VIEWPORT_SIZE / 2 + offset.x - displayWidth / 2) * outputScale;
    const drawY = (VIEWPORT_SIZE / 2 + offset.y - displayHeight / 2) * outputScale;

    ctx.drawImage(imgRef.current, drawX, drawY, drawWidth, drawHeight);

    canvas.toBlob(
      (blob) => {
        if (blob) onSave(blob);
      },
      "image/jpeg",
      0.92,
    );
  };

  return (
    <div className="cropper_overlay">
      <div className="cropper_box">
        <h5 className="auth_heading verify_title">Adjust your photo</h5>
        <p className="verify_copy">Drag to reposition, use the slider to zoom.</p>

        <div
          className="cropper_viewport"
          style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          {natural.width > 0 && (
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              draggable={false}
              className="cropper_image"
              style={{
                width: displayWidth,
                height: displayHeight,
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
              }}
            />
          )}
        </div>

        <input
          type="range"
          min="1"
          max="3"
          step="0.01"
          value={zoom}
          onChange={handleZoomChange}
          className="cropper_zoom"
          aria-label="Zoom"
        />

        <div className="cropper_actions">
          <button type="button" className="link_btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="auth_submit" onClick={handleSave} disabled={!natural.width}>
            Use Photo
          </button>
        </div>
      </div>
    </div>
  );
}