"""
Machine Learning Anomaly Detection Model for Forest Rights Act (FRA) Claims.

Model: Unsupervised Isolation Forest (scikit-learn)
Features used:
  - claimedArea
  - recordedArea
  - processingDays
  - landCoverChange
  - areaMismatch (derived percentage: |claimedArea - recordedArea| / max(recordedArea, 0.01) * 100)

Strictly excluded from training:
  - claimId, state, district, status, or any synthetic anomaly ground-truth labels.

Ground-truth evaluation:
  - Synthetic ground-truth labels ('isAnomalous') are evaluated ONLY post-prediction
    to evaluate precision, recall, F1, and ROC-AUC.

Artifacts saved:
  - ml/model.pkl
  - ml/results.json
"""

import os
import json
import joblib
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

RANDOM_SEED = 42


def train_anomaly_detector():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    claims_file = os.path.join(base_dir, 'src', 'data', 'claims.geojson')
    ml_dir = os.path.join(base_dir, 'ml')
    model_file = os.path.join(ml_dir, 'model.pkl')
    results_file = os.path.join(ml_dir, 'results.json')

    print(f"Loading claims dataset from: {claims_file}")
    with open(claims_file, 'r', encoding='utf-8') as f:
        geojson_data = json.load(f)

    features = geojson_data['features']
    num_claims = len(features)
    print(f"Successfully loaded {num_claims} claims from GeoJSON.")

    # 1. Extract Training Features (strictly numeric cadastral/GIS indicators)
    # Excludes: claimId, state, district, status, and isAnomalous
    X_rows = []
    claim_ids = []
    y_ground_truth = []

    for feat in features:
        p = feat['properties']
        cid = p['claimId']
        c_area = float(p['claimedArea'])
        r_area = float(p['recordedArea'])
        p_days = float(p['processingDays'])
        lc_change = float(p['landCoverChange'])

        # Derived areaMismatch percentage
        area_mismatch_pct = abs(c_area - r_area) / max(r_area, 0.01) * 100.0

        X_rows.append([c_area, r_area, p_days, lc_change, area_mismatch_pct])
        claim_ids.append(cid)

        # Ground truth kept separate strictly for post-prediction validation
        y_ground_truth.append(1 if p.get('isAnomalous', False) else 0)

    feature_names = [
        "claimedArea",
        "recordedArea",
        "processingDays",
        "landCoverChange",
        "areaMismatch"
    ]

    X = np.array(X_rows, dtype=np.float64)
    y_true = np.array(y_ground_truth, dtype=np.int32)

    print(f"\nTraining Feature Matrix Shape: {X.shape}")
    print(f"Feature columns: {feature_names}")
    print("Note: Ground-truth anomaly labels are NOT used during model training.")

    # 2. Train Unsupervised Isolation Forest
    # Contamination set to 0.10 (~10% expected anomaly rate)
    model = IsolationForest(
        n_estimators=150,
        contamination=0.10,
        random_state=RANDOM_SEED,
        max_samples='auto',
        n_jobs=1
    )

    print("\nTraining Isolation Forest model...")
    model.fit(X)
    print("Model training completed successfully.")

    # 3. Model Predictions & Anomaly Scoring
    # raw_pred: -1 for anomaly/outlier, 1 for inlier
    raw_pred = model.predict(X)
    is_anomaly_pred = (raw_pred == -1).astype(int)

    # Decision function: lower values mean more anomalous
    # Negate so higher value means higher anomaly severity
    decision_scores = -model.decision_function(X)

    # Min-max normalized anomaly score to 0 - 100 scale
    score_min = np.min(decision_scores)
    score_max = np.max(decision_scores)
    norm_scores = ((decision_scores - score_min) / (score_max - score_min)) * 100.0

    # 4. Categorize Risk Levels: HIGH, MEDIUM, LOW
    # High Risk: Model flagged as outlier (pred == -1, top ~10%)
    # Medium Risk: Next borderline suspicious band (75th percentile to threshold)
    # Low Risk: Standard conforming claims (< 75th percentile)
    p75 = np.percentile(decision_scores, 75)

    risk_levels = []
    for i in range(num_claims):
        if is_anomaly_pred[i] == 1:
            risk_levels.append("HIGH")
        elif decision_scores[i] >= p75:
            risk_levels.append("MEDIUM")
        else:
            risk_levels.append("LOW")

    high_count = risk_levels.count("HIGH")
    medium_count = risk_levels.count("MEDIUM")
    low_count = risk_levels.count("LOW")

    print("\n--- ANOMALY RISK LEVEL DISTRIBUTION ---")
    print(f"HIGH Risk:   {high_count} ({100 * high_count / num_claims:.1f}%)")
    print(f"MEDIUM Risk: {medium_count} ({100 * medium_count / num_claims:.1f}%)")
    print(f"LOW Risk:    {low_count} ({100 * low_count / num_claims:.1f}%)")

    # 5. Post-Prediction Validation Against Ground-Truth Synthetic Label
    precision = float(precision_score(y_true, is_anomaly_pred, zero_division=0))
    recall = float(recall_score(y_true, is_anomaly_pred, zero_division=0))
    f1 = float(f1_score(y_true, is_anomaly_pred, zero_division=0))
    roc_auc = float(roc_auc_score(y_true, decision_scores))
    cm = confusion_matrix(y_true, is_anomaly_pred).tolist()

    tn, fp, fn, tp = int(cm[0][0]), int(cm[0][1]), int(cm[1][0]), int(cm[1][1])

    print("\n--- VALIDATION METRICS (VS GROUND TRUTH) ---")
    print(f"Ground Truth Anomalies: {np.sum(y_true)} / {num_claims} ({100 * np.sum(y_true) / num_claims:.1f}%)")
    print(f"Model Predicted Anomalies: {np.sum(is_anomaly_pred)} / {num_claims} ({100 * np.sum(is_anomaly_pred) / num_claims:.1f}%)")
    print(f"Precision: {precision:.4f} (True Positives / Predicted Positives)")
    print(f"Recall:    {recall:.4f} (True Positives / Actual Positives)")
    print(f"F1-Score:  {f1:.4f}")
    print(f"ROC-AUC:   {roc_auc:.4f}")
    print(f"\nConfusion Matrix:")
    print(f"  True Negatives (TN):  {tn}")
    print(f"  False Positives (FP): {fp}")
    print(f"  False Negatives (FN): {fn}")
    print(f"  True Positives (TP):  {tp}")

    # 6. Save Model to ml/model.pkl
    os.makedirs(ml_dir, exist_ok=True)
    print(f"\nSaving trained model to: {model_file}")
    joblib.dump(model, model_file)

    # 7. Prepare and Save Detailed Results to ml/results.json
    per_claim_results = []
    for i in range(num_claims):
        p = features[i]['properties']
        per_claim_results.append({
            "claimId": claim_ids[i],
            "state": p.get('state'),
            "district": p.get('district'),
            "claimedArea": p.get('claimedArea'),
            "recordedArea": p.get('recordedArea'),
            "processingDays": p.get('processingDays'),
            "landCoverChange": p.get('landCoverChange'),
            "areaMismatchPct": round(X[i][4], 2),
            "status": p.get('status'),
            "rawAnomalyScore": round(float(decision_scores[i]), 5),
            "normalizedAnomalyScore": round(float(norm_scores[i]), 2),
            "predictedAnomaly": bool(is_anomaly_pred[i]),
            "riskLevel": risk_levels[i],
            "groundTruthAnomaly": bool(y_true[i])
        })

    results_payload = {
        "metadata": {
            "modelType": "IsolationForest",
            "library": "scikit-learn",
            "randomSeed": RANDOM_SEED,
            "totalClaims": num_claims,
            "trainingFeatures": feature_names,
            "contaminationRate": 0.10
        },
        "riskLevelSummary": {
            "HIGH": high_count,
            "MEDIUM": medium_count,
            "LOW": low_count
        },
        "validationMetrics": {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1Score": round(f1, 4),
            "rocAuc": round(roc_auc, 4),
            "confusionMatrix": {
                "trueNegative": tn,
                "falsePositive": fp,
                "falseNegative": fn,
                "truePositive": tp
            }
        },
        "claims": per_claim_results
    }

    print(f"Saving prediction results to: {results_file}")
    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump(results_payload, f, indent=2)

    print("All tasks completed successfully!")
    return results_payload


if __name__ == '__main__':
    train_anomaly_detector()
