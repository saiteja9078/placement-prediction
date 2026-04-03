from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

# Load pipeline model + label encoder
pipeline = joblib.load('trained_pipeline_model.joblib')
le = joblib.load('label_encoder.joblib')

# Feature columns — must match training order
FEATURE_ORDER = [
    'CGPA', 'Internships', 'Projects', 'Workshops/Certifications',
    'AptitudeTestScore', 'SoftSkillsRating',
    'ExtracurricularActivities', 'PlacementTraining',
    'SSC_Marks', 'HSC_Marks', 'CodingScore'
]

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()

    # Pipeline handles encoding internally via OneHotEncoder —
    # just pass 'Yes'/'No' strings directly (no manual 0/1 conversion!)
    row = {col: data[col] for col in FEATURE_ORDER}
    df = pd.DataFrame([row])

    # Predict
    prob_array = pipeline.predict_proba(df)[0]
    # Find index of 'Placed' class
    placed_idx = list(le.classes_).index('Placed')
    prob = float(prob_array[placed_idx])
    prediction = 'Placed' if prob >= 0.5 else 'NotPlaced'

    print(f"[Flask] ALL 11 FEATURES RECEIVED:")
    for col in FEATURE_ORDER:
        print(f"  {col}: {row.get(col, 'MISSING!')}")
    print(f"[Flask] → prob={prob:.4f} → {prediction}")

    return jsonify({
        'probability': round(prob, 4),
        'prediction': prediction,
        'confidence': round(max(prob, 1 - prob), 4)
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model': 'Pipeline(StandardScaler+OneHotEncoder+RandomForest)'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
