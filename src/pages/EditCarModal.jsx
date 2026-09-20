// src/Components/EditCarModal.jsx
import React, { useState } from 'react';
import { Modal, ModalBody } from 'reactstrap';
import './EditCarModal.css';
import { carsApi } from '../services/carsApi';

const AMENITY_FIELDS = [
  { key: 'has_wifi', label: 'Wi-Fi' },
  { key: 'has_air_conditioning', label: 'Air conditioning' },
  { key: 'has_power_outlets', label: 'Power outlets' },
  { key: 'smoking_allowed', label: 'Smoking allowed' },
  { key: 'pets_allowed', label: 'Pets allowed' },
  { key: 'wheelchair_accessible', label: 'Wheelchair accessible' },
];

const Icon = {
  Close: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Alert: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7.5v6M12 16.6v.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  ),
};

export default function EditCarModal({ car, onClose, onSaved }) {
  const [form, setForm] = useState({
    make: car.make || '',
    model: car.model || '',
    year: car.year || '',
    color: car.color || '',
    plate_number: car.plate_number || '',
    capacity: car.capacity || 4,
    is_tinted: !!car.is_tinted,
    has_wifi: !!car.has_wifi,
    has_air_conditioning: !!car.has_air_conditioning,
    has_power_outlets: !!car.has_power_outlets,
    smoking_allowed: !!car.smoking_allowed,
    pets_allowed: !!car.pets_allowed,
    wheelchair_accessible: !!car.wheelchair_accessible,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.make.trim()) return setError('Make is required.');
    if (!form.model.trim()) return setError('Model is required.');
    if (!form.year) return setError('Year is required.');
    if (!form.color.trim()) return setError('Colour is required.');
    if (!form.plate_number.trim()) return setError('Plate number is required.');
    if (Number(form.capacity) < 1) return setError('Capacity must be at least 1.');

    setSaving(true);
    try {
      const payload = {
        make: form.make.trim(),
        model: form.model.trim(),
        year: Number(form.year),
        color: form.color.trim(),
        plate_number: form.plate_number.trim(),
        capacity: Number(form.capacity),
        is_tinted: !!form.is_tinted,
        has_wifi: !!form.has_wifi,
        has_air_conditioning: !!form.has_air_conditioning,
        has_power_outlets: !!form.has_power_outlets,
        smoking_allowed: !!form.smoking_allowed,
        pets_allowed: !!form.pets_allowed,
        wheelchair_accessible: !!form.wheelchair_accessible,
      };
      const updated = await carsApi.update(car.id, payload);
      onSaved(updated);
    } catch (err) {
      setError(err.message || 'Failed to update car.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen centered toggle={onClose} className="edit_car_modal" backdrop="static">
      <ModalBody className="edit_car_body">
        <button className="edit_car_close" onClick={onClose} aria-label="Close">
          <Icon.Close />
        </button>

        <h3 className="edit_car_title">Edit car</h3>
        <p className="edit_car_subtitle">
          Update the details for {car.make} {car.model}.
        </p>

        {error && (
          <div className="edit_car_alert">
            <Icon.Alert />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="edit_car_form">
          <div className="edit_car_row">
            <div className="edit_car_field">
              <label>Make</label>
              <input value={form.make} onChange={set('make')} required />
            </div>
            <div className="edit_car_field">
              <label>Model</label>
              <input value={form.model} onChange={set('model')} required />
            </div>
          </div>

          <div className="edit_car_row">
            <div className="edit_car_field">
              <label>Year</label>
              <input type="number" value={form.year} onChange={set('year')} required />
            </div>
            <div className="edit_car_field">
              <label>Colour</label>
              <input value={form.color} onChange={set('color')} required />
            </div>
          </div>

          <div className="edit_car_row">
            <div className="edit_car_field">
              <label>Plate number</label>
              <input value={form.plate_number} onChange={set('plate_number')} required />
            </div>
            <div className="edit_car_field">
              <label>Capacity</label>
              <input type="number" min="1" max="20" value={form.capacity} onChange={set('capacity')} required />
            </div>
          </div>

          <div className="edit_car_section_label">Features</div>
          <div className="edit_car_checks">
            <label className="edit_car_check">
              <input type="checkbox" checked={form.is_tinted} onChange={set('is_tinted')} />
              <span>Tinted windows</span>
            </label>
            {AMENITY_FIELDS.map((f) => (
              <label key={f.key} className="edit_car_check">
                <input type="checkbox" checked={!!form[f.key]} onChange={set(f.key)} />
                <span>{f.label}</span>
              </label>
            ))}
          </div>

          <div className="edit_car_actions">
            <button type="button" className="edit_car_btn ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="edit_car_btn primary" disabled={saving}>
              {saving ? <span className="edit_car_spinner" /> : 'Save changes'}
            </button>
          </div>
        </form>
      </ModalBody>
    </Modal>
  );
}