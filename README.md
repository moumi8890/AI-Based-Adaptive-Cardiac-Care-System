# MediConnect AI

An educational healthcare demonstration app built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

## Features

- **Patient Dashboard** — Submit health updates with vitals and symptoms, get AI guidance previews, and view ML risk classification.
- **Doctor Dashboard** — View all patients, filter by risk level, review health submissions, and send recommendations.
- **AI Assistants** — Both patient and doctor have AI chat assistants for educational guidance.
- **GPS Location Tracking & Sharing** — Patients can share their live location with consent. Doctors see the patient's live pin via realtime updates.

## GPS Location Tracking

### How it works

1. Patient taps "Share my live location" on the Location Sharing page.
2. The browser requests GPS permission. Location points are saved every ~7 seconds to the `location_updates` table.
3. A live Leaflet + OpenStreetMap map shows the patient's position with an accuracy circle.
4. The doctor sees the patient's live pin on the Patient Detail page via Supabase Realtime.
5. Patient can generate Google Maps, WhatsApp, and SMS share links (nothing is sent automatically).
6. Nearest hospitals are calculated using the Haversine distance formula.
7. Tracking stops when the patient taps "Stop sharing" or logs out.
8. Location trails older than 24 hours are automatically deleted.

### Privacy

- Location is tracked **only** when the patient explicitly starts sharing.
- The "Location sharing ON" indicator with a "Stop sharing" button appears on every patient screen while active.
- Doctors can only see location points for patients who are actively sharing (`is_sharing_location = true`).
- Location trails are deleted 24 hours after sharing ends.

### HTTPS Requirement

GPS location tracking requires a **secure context**: HTTPS or `localhost`. The Geolocation API will not work over plain HTTP on a remote host. If you see a "Location tracking requires HTTPS or localhost" error, deploy your app with HTTPS enabled.

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Supabase (PostgreSQL + Realtime)
- Leaflet 1.9.4 + react-leaflet 4.2.1 (OpenStreetMap tiles, no API key)
- Lucide React icons
