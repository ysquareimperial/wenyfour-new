// src/pages/MyCars.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './MyCars.css';

const API_BASE = 'https://api.wenyfour.com.ng';

function getAuthToken() {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('auth_token') ||
    ''
  );
}

const AMENITY_LABELS = {
  has_wifi: 'Wi-Fi',
  has_air_conditioning: 'A/C',
  has_power_outlets: 'Power',
  smoking_allowed: 'Smoking',
  pets_allowed: 'Pets',
  wheelchair_accessible: 'Accessible',
  is_tinted: 'Tinted',
};

const Icon = {
  Plus: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Car: (p) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M4 15v-2.2l1.4-3.9A2 2 0 0 1 7.3 7.5h9.4a2 2 0 0 1 1.9 1.4L20 12.8V15"
        stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M3.5 15h17v3.2a1 1 0 0 1-1 1h-1.6a1 1 0 0 1-1-1V18H7.1v.2a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1V15Z"
        stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="7.5" cy="15" r=".9" fill="currentColor" />
      <circle cx="16.5" cy="15" r=".9" fill="currentColor" />
    </svg>
  ),
  Alert: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7.5v6M12 16.6v.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  ),
  Arrow: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

function activeAmenities(car) {
  return Object.entries(AMENITY_LABELS)
    .filter(([key]) => car[key] === true)
    .map(([, label]) => label);
}

function CarCard({ car }) {
  const amenities = activeAmenities(car);
  const primaryPhoto = Array.isArray(car.photos) && car.photos.find((p) => p.is_primary)?.photo_url;

  return (
    <article className="my_car_card">
      <div className="my_car_media" aria-hidden="true">
        {primaryPhoto ? (
          <img src={primaryPhoto} alt="" />
        ) : (
          <Icon.Car />
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
              <span key={a} className="my_car_amenity">{a}</span>
            ))}
          </div>
        )}
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
  const [cars, setCars] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const fetchCars = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setStatus('error');
      setErrorMsg('You need to be signed in to view your cars.');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE}/cars/my-cars`, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Your session has expired. Please sign in again.');
        }
        throw new Error(`Request failed with ${res.status}`);
      }

      const data = await res.json();
      setCars(Array.isArray(data) ? data : []);
      setStatus('success');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[my cars] failed:', err);
      setStatus('error');
      setErrorMsg('Something went wrong while loading your cars. Please try again.');
    }
  }, []);

  useEffect(() => { fetchCars(); }, [fetchCars]);

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

        {status === 'loading' && (
          <div className="myc_list" aria-busy="true">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {status === 'error' && (
          <div className="myc_state" role="alert">
            <div className="myc_state_icon error"><Icon.Alert /></div>
            <h3 className="myc_state_title">We couldn&apos;t load your cars</h3>
            <p className="myc_state_copy">{errorMsg}</p>
            <button type="button" className="myc_btn primary" onClick={fetchCars}>
              Try again
            </button>
          </div>
        )}

        {status === 'success' && cars && cars.length === 0 && (
          <div className="myc_state">
            <div className="myc_state_icon"><Icon.Car /></div>
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

        {status === 'success' && cars && cars.length > 0 && (
          <div className="myc_list">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}