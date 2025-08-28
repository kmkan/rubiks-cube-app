import React from 'react';
import './Loader.css';

export function Loader() {
  return (
    <div className="loader-container">
      <div className="spinner"></div>
      <p>Loading Cube...</p>
    </div>
  );
}