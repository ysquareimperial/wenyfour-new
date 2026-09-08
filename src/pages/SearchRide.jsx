// src/pages/SearchRide.jsx
import React from 'react';
import './SearchRide.css';

const SearchRide = () => {
  return (
    <div className="search-ride-container">
      <div className="brand-header">
        Bus and carpool: <span>Travel your way with BlaBlaCar</span>
      </div>

      <form>
        <div className="form-group">
          <label>From</label>
          <input
            type="text"
            placeholder="City, station, place"
          />
        </div>

        <div className="form-group">
          <label>To</label>
          <input
            type="text"
            placeholder="City, station, place"
          />
        </div>

        <div className="row-duo">
          <div className="form-group">
            <label>Departure</label>
            <input
              type="text"
              placeholder="Today"
              defaultValue="Today"
            />
          </div>
          <div className="form-group">
            <label>Return</label>
            <input
              type="text"
              placeholder="Date"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Passengers</label>
          <select defaultValue="1">
            <option value="1">1 passenger</option>
            <option value="2">2 passengers</option>
            <option value="3">3 passengers</option>
            <option value="4">4 passengers</option>
            <option value="5">5 passengers</option>
            <option value="6">6 passengers</option>
          </select>
        </div>

        <button type="submit" className="search-btn">
          Search
        </button>
      </form>
    </div>
  );
};

export default SearchRide;