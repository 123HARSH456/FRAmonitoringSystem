# CANOPY — Community Access & Navigation for Ownership and Protection of Yields

A web application and anomaly detection system for tracking, reviewing, and verifying Forest Rights Act claims across India.

## What This Project Does

The Forest Rights Act (FRA) recognizes the rights of forest-dwelling communities to forest land and resources. Processing and verifying these claims requires checking land areas, official records, and satellite data across many districts.

This system provides:
- A national dashboard showing claim statistics across states.
- An interactive map view using satellite imagery to inspect district boundaries and specific claim plots.
- An anomaly detection model that flags suspicious claims (such as large differences between claimed and recorded land area).
- A claim details panel with optional AI explanations to help officers quickly review flagged applications.

## Key Features

- National Overview: View total claims, approval rates, and state-wise numbers on a map.
- State and District Level GIS: Explore claims overlaid on Esri satellite imagery with district boundaries.
- Claim Inspection: Click on any claim to view applicant details, claimed area, recorded area, and processing timeline.
- Anomaly Detection: An Isolation Forest machine learning model flags claims that have abnormal data patterns.
- Plain-Language Explanations: Uses the Gemini API to summarize why a claim was flagged, helping non-technical reviewers make decisions.

## Tech Stack

- Frontend: React 19, Vite, Tailwind CSS v4, React Router
- Maps: Leaflet, React Leaflet, Esri World Imagery
- Machine Learning: Python, scikit-learn (Isolation Forest), NumPy, Joblib
- AI Service: Google Gemini API (optional)

## Project Structure

```
FRmonitoringSystem/
  src/
    components/      UI components (maps, claim panels, header)
    pages/           Page layouts (National Overview, State Monitoring)
    data/            GeoJSON maps, sample claims, state statistics
    services/        Data handling, anomaly checks, and Gemini API calls
    utils/           Helper functions for formatting and caching
  ml/
    train.py         Python script to train the anomaly detection model
    requirements.txt Python dependencies for training
    model.pkl        Trained Isolation Forest model
    results.json     Model evaluation results
  public/            Static assets and GeoJSON map files
```

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm (comes with Node.js)
- Python 3.8+ (only needed if you want to retrain the machine learning model)

### Installation

1. Navigate to the application folder:
   ```bash
   cd FRmonitoringSystem
   ```

2. Install the required packages:
   ```bash
   npm install
   ```

3. Configure environment variables (optional):
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and add your Google Gemini API key if you want to use the AI claim explanation feature. The application works without this key, but the AI explanation feature will be disabled.

### Running the Application

Start the local development server:
```bash
npm run dev
```

Vite will print a local URL in your terminal (usually `http://localhost:5173`). Open that URL in your web browser.

### Building for Production

To create an optimized production build:
```bash
npm run build
```

The output will be saved to the `dist` folder. You can preview the build locally with:
```bash
npm run preview
```

## Machine Learning Model

The project includes an unsupervised machine learning model that detects anomalies in claims.

- Model type: Isolation Forest (scikit-learn)
- Inputs used: Claimed area, recorded area, processing days, land cover change, and percentage mismatch between claimed and recorded area.
- Excluded from training: Personal identifiers, state, district, and status.

To retrain or run the model:
1. Navigate to the ml folder:
   ```bash
   cd FRmonitoringSystem/ml
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the training script:
   ```bash
   python train.py
   ```
This will update `model.pkl` and save performance metrics in `results.json`.

## License

This project was built for hackathon demonstration and research purposes.
