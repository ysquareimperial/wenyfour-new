// src/pages/MyCars.jsx
import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { carsApi, getAuthToken, photoUrl } from "../services/carsApi";

import { Modal, ModalBody } from "reactstrap";
import "./MyCars.css";
import EditCarModal from "./EditCarModal";

const AMENITY_LABELS = {
  has_wifi: "Wi-Fi",
  has_air_conditioning: "A/C",
  has_power_outlets: "Power",
  smoking_allowed: "Smoking",
  pets_allowed: "Pets",
  wheelchair_accessible: "Accessible",
  is_tinted: "Tinted",
};

const Icon = {
  Plus: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Car: (p) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M4 15v-2.2l1.4-3.9A2 2 0 0 1 7.3 7.5h9.4a2 2 0 0 1 1.9 1.4L20 12.8V15"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 15h17v3.2a1 1 0 0 1-1 1h-1.6a1 1 0 0 1-1-1V18H7.1v.2a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1V15Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="15" r=".9" fill="currentColor" />
      <circle cx="16.5" cy="15" r=".9" fill="currentColor" />
    </svg>
  ),
  Alert: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 7.5v6M12 16.6v.2"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  ),
  Arrow: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M5 12h13M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Edit: (p) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M12 20h9M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Trash: (p) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Image: (p) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" {...p}>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="m21 15-5-5L5 21"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

function activeAmenities(car) {
  return Object.entries(AMENITY_LABELS)
    .filter(([key]) => car[key] === true)
    .map(([, label]) => label);
}

function CarCard({ car, onEdit, onDelete, onManagePhotos, deleting }) {
  const amenities = activeAmenities(car);
  const photos = Array.isArray(car.photos) ? car.photos : [];
  const primary = photos.find((p) => p.is_primary) || photos[0];
  const primarySrc = primary ? photoUrl(primary) : "";

  return (
    <article className="my_car_card">
      <div className="my_car_media" aria-hidden="true">
        {primarySrc ? (
          <img
            src={primarySrc}
            alt=""
            onError={(e) => {
              e.currentTarget.style.display = "none";
              // Fallback: keep the icon rendered behind
            }}
          />
        ) : (
          <Icon.Car />
        )}
        {photos.length > 0 && (
          <span className="my_car_photo_count">{photos.length}</span>
        )}
      </div>

      <div className="my_car_body">
        <header className="my_car_head">
          <div className="my_car_name">
            <h3>
              {car.make} {car.model}
            </h3>
            <span className="my_car_year">{car.year}</span>
          </div>
          <span className="my_car_plate">{car.plate_number}</span>
        </header>

        <div className="my_car_meta">
          <span className="my_car_meta_item">{car.color}</span>
          <span className="my_car_meta_dot" aria-hidden="true" />
          <span className="my_car_meta_item">{car.capacity} seats</span>
        </div>

        {amenities.length > 0 && (
          <div className="my_car_amenities">
            {amenities.map((a) => (
              <span key={a} className="my_car_amenity">
                {a}
              </span>
            ))}
          </div>
        )}

        <div className="my_car_actions">
          <button
            type="button"
            className="my_car_action_btn"
            onClick={() => onEdit(car)}
          >
            <Icon.Edit />
            Edit
          </button>
          <button
            type="button"
            className="my_car_action_btn danger"
            onClick={() => onDelete(car)}
            disabled={deleting}
          >
            <Icon.Trash />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="my_car_card my_car_sk" aria-hidden="true">
      <div className="my_car_media sk" />
      <div className="my_car_body">
        <div className="my_car_sk_line w60" />
        <div className="my_car_sk_line w40" />
        <div className="my_car_sk_line w80" />
      </div>
    </div>
  );
}

export default function MyCars() {
  const navigate = useNavigate();
  const [cars, setCars] = useState(null);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [editingCar, setEditingCar] = useState(null);
  const [photoCar, setPhotoCar] = useState(null);
  const [deletingCar, setDeletingCar] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchCars = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setStatus("error");
      setErrorMsg("You need to be signed in to view your cars.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const data = await carsApi.list();
      setCars(data);
      setStatus("success");
    } catch (err) {
      console.error("[my cars] failed:", err);
      setStatus("error");
      setErrorMsg(
        err.message || "Something went wrong while loading your cars.",
      );
    }
  }, []);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  const handleSaved = (updatedCar) => {
    setCars((prev) =>
      prev ? prev.map((c) => (c.id === updatedCar.id ? updatedCar : c)) : prev,
    );
    setEditingCar(null);
    showToast("Car updated successfully");
  };

  const handlePhotosUpdated = (updatedCar) => {
    setCars((prev) =>
      prev ? prev.map((c) => (c.id === updatedCar.id ? updatedCar : c)) : prev,
    );
    setPhotoCar(updatedCar);
    showToast("Photos updated");
  };

  const confirmDelete = async () => {
    if (!deletingCar) return;
    setDeleteLoading(true);
    try {
      await carsApi.remove(deletingCar.id);
      setCars((prev) =>
        prev ? prev.filter((c) => c.id !== deletingCar.id) : prev,
      );
      showToast("Car deleted");
      setDeletingCar(null);
    } catch (err) {
      console.error("[delete car] failed:", err);
      showToast(err.message || "Failed to delete car", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="my_cars_page">
      <div className="myc_inner">
        <header className="myc_header">
          <div>
            <p className="myc_eyebrow">Driver</p>
            <h1 className="myc_title">My cars</h1>
            <p className="myc_subtitle">
              Cars on your profile. Add a car to publish more rides.
            </p>
          </div>

          <Link to="/cars/new" className="myc_add_btn">
            <Icon.Plus />
            Add a car
          </Link>
        </header>

        {toast && (
          <div className={`myc_toast ${toast.type === "error" ? "error" : ""}`}>
            {toast.message}
          </div>
        )}

        {status === "loading" && (
          <div className="myc_list" aria-busy="true">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {status === "error" && (
          <div className="myc_state" role="alert">
            <div className="myc_state_icon error">
              <Icon.Alert />
            </div>
            <h3 className="myc_state_title">We couldn&apos;t load your cars</h3>
            <p className="myc_state_copy">{errorMsg}</p>
            <button
              type="button"
              className="myc_btn primary"
              onClick={fetchCars}
            >
              Try again
            </button>
          </div>
        )}

        {status === "success" && cars && cars.length === 0 && (
          <div className="myc_state">
            <div className="myc_state_icon">
              <Icon.Car />
            </div>
            <h3 className="myc_state_title">No cars yet</h3>
            <p className="myc_state_copy">
              Add your first car to start publishing rides on wenyfour.
            </p>
            <Link to="/cars/new" className="myc_btn primary">
              Add a car
              <Icon.Arrow />
            </Link>
          </div>
        )}

        {status === "success" && cars && cars.length > 0 && (
          <div className="myc_list">
            {cars.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                onEdit={setEditingCar}
                onDelete={setDeletingCar}
                onManagePhotos={setPhotoCar}
                deleting={deleteLoading && deletingCar?.id === car.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Car Modal */}
      {editingCar && (
        <EditCarModal
          car={editingCar}
          onClose={() => setEditingCar(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Photo Manager Modal */}
      {photoCar && (
        <PhotoManagerModal
          car={photoCar}
          onClose={() => setPhotoCar(null)}
          onUpdated={handlePhotosUpdated}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingCar}
        centered
        toggle={() => !deleteLoading && setDeletingCar(null)}
        className="myc_confirm_modal"
        backdrop="static"
      >
        <ModalBody className="myc_confirm_body">
          <div className="myc_confirm_icon">
            <Icon.Trash />
          </div>
          <h3 className="myc_confirm_title">Delete this car?</h3>
          <p className="myc_confirm_copy">
            <strong>
              {deletingCar?.make} {deletingCar?.model}
            </strong>{" "}
            ({deletingCar?.plate_number}) will be permanently removed from your
            profile. This cannot be undone.
          </p>
          <div className="myc_confirm_actions">
            <button
              type="button"
              className="myc_btn"
              onClick={() => setDeletingCar(null)}
              disabled={deleteLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="myc_btn danger"
              onClick={confirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? <span className="myc_spinner" /> : "Delete car"}
            </button>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}
