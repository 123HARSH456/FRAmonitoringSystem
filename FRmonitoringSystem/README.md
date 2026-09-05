# CANOPY — Forest Rights Act (FRA) Monitoring System

CANOPY (Community Access & Navigation for Ownership and Protection of Yields) is a web-based dashboard and GIS monitoring tool for tracking, reviewing, and verifying Forest Rights Act (FRA 2006) claims across India.

## Overview

The Forest Rights Act recognizes the rights of forest-dwelling tribal communities and traditional forest dwellers to forest land and resources. Reviewing these claims requires verifying land boundaries, official records, processing timelines, and ground-level land cover.

CANOPY provides:
- A national overview of claim statistics across Indian states and union territories.
- Interactive GIS maps using high-resolution satellite imagery with official state and district boundaries.
- An anomaly detection engine that flags suspicious claims based on land area mismatches, processing delays, and land-use shifts.
- A claim investigation panel with structured evidence checklists and audit trails to assist reviewing officers.
- Multiple visual themes for different lighting conditions and user preferences.
- Responsive mobile and desktop layouts.

## Features

- National Overview Map: View total claims received, approved, rejected, and pending across India, along with state-by-state approval rates.
- State-Level GIS Explorer: Inspect individual state boundaries with masked satellite imagery (Esri World Imagery) and district-level outlines.
- Claim Inspection: Click on any claim marker to review applicant information, claimed area versus recorded area, and processing status.
- Evidence & Anomaly Detection: An Isolation Forest machine learning model and rule checks detect abnormal claim patterns, such as significant area discrepancies.
- Theme Customization: Switch between multiple built-in color themes (including Forest Dark, Modern Green, Midnight Navy, Forest Slate, and High Contrast).
- Mobile Support: Responsive design with a bottom sheet drawer for smooth navigation on mobile screens.

## Tech Stack

- Frontend: React 19, Vite, Tailwind CSS v4, React Router
- Maps & GIS: Leaflet, React-Leaflet, Esri World Imagery, GeoJSON boundary masks
- Icons: Lucide React
- Machine Learning: Python, scikit-learn (Isolation Forest), NumPy, Joblib
- Deployment: Vercel

## Project Structure

```
src/
  components/
    NationalMap/     India overview map and state summary components
    StateMap/        Satellite GIS map and district boundary layers
    ClaimPanel/      Claim inspection, evidence details, and audit panels
    common/          Header, navigation, and theme selector
  context/           Theme context and state management
  data/              Sample claims, state statistics, and GeoJSON boundaries
  services/          Claim filtering, calculations, and anomaly checks
  utils/             Formatting and caching helpers
ml/
  train.py           Training script for the Isolation Forest anomaly detector
  requirements.txt   Python package dependencies for ML
  model.pkl          Serialized trained model
  results.json       Training evaluation metrics
public/              Static assets, logos, and high-resolution state mask files
scripts/             Utility scripts for boundary verification and mask generation
```

## Getting Started

### Prerequisites

- Node.js (version 18 or later)
- npm (installed automatically with Node.js)
- Python 3.8+ (optional, only needed if retraining the ML model)

### Installation

Install the dependencies:
```bash
npm install
```

### Running Locally

Start the local development server:
```bash
npm run dev
```

Open the URL shown in your terminal (usually http://localhost:5173) in your web browser.

### Building for Production

To create a production build:
```bash
npm run build
```

To preview the production build locally:
```bash
npm run preview
```

### Deployment

This project includes configuration for deployment on Vercel:
- `vercel.json` is configured to build the project and serve the `dist` directory.
- The app can be connected directly to Vercel via GitHub or deployed using the Vercel CLI.

## Machine Learning Model

The project includes an unsupervised machine learning model that flags irregular claims for manual audit.

- Algorithm: Isolation Forest (scikit-learn)
- Features used: Claimed area, recorded area, processing days, land cover change index, and percentage mismatch between claimed and recorded area.
- Excluded from training: Personal identifiers, names, locations, and application status.

To retrain the model:
1. Navigate to the `ml` folder:
   ```bash
   cd ml
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the training script:
   ```bash
   python train.py
   ```
This updates `model.pkl` and writes summary metrics to `results.json`.

## License

This project is open-source and intended for hackathon demonstration, research, and educational purposes.
