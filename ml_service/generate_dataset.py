"""
Generate placementdata.csv with 10,000 student records.
11 features + 1 target (PlacementStatus).
CodingScore (0-30) is the new 11th feature.
"""
import numpy as np
import pandas as pd

np.random.seed(42)

N = 10000
PLACED_RATIO = 0.42
n_placed = int(N * PLACED_RATIO)
n_not_placed = N - n_placed

def gen_placed(n):
    return pd.DataFrame({
        'CGPA': np.round(np.clip(np.random.normal(8.02, 0.45, n), 6.5, 9.1), 2),
        'Internships': np.random.choice([0, 1, 2], n, p=[0.16, 0.43, 0.41]),
        'Projects': np.random.choice([0, 1, 2, 3], n, p=[0.004, 0.14, 0.19, 0.666]),
        'Workshops/Certifications': np.random.choice([0, 1, 2, 3], n, p=[0.25, 0.13, 0.58, 0.04]),
        'AptitudeTestScore': np.round(np.clip(np.random.normal(84.46, 3.5, n), 60, 90), 0).astype(int),
        'SoftSkillsRating': np.round(np.clip(np.random.normal(4.53, 0.2, n), 3.0, 4.8), 2),
        'ExtracurricularActivities': np.random.choice(['Yes', 'No'], n, p=[0.86, 0.14]),
        'PlacementTraining': np.random.choice(['Yes', 'No'], n, p=[0.90, 0.10]),
        'SSC_Marks': np.round(np.clip(np.random.normal(74.92, 6.0, n), 55, 90), 0).astype(int),
        'HSC_Marks': np.round(np.clip(np.random.normal(79.81, 4.5, n), 57, 88), 0).astype(int),
        'CodingScore': np.round(np.clip(np.random.normal(21, 4.0, n), 0, 30), 0).astype(int),
        'PlacementStatus': 'Placed'
    })

def gen_not_placed(n):
    return pd.DataFrame({
        'CGPA': np.round(np.clip(np.random.normal(7.47, 0.45, n), 6.5, 9.1), 2),
        'Internships': np.random.choice([0, 1, 2], n, p=[0.23, 0.64, 0.13]),
        'Projects': np.random.choice([0, 1, 2, 3], n, p=[0.01, 0.20, 0.45, 0.34]),
        'Workshops/Certifications': np.random.choice([0, 1, 2, 3], n, p=[0.35, 0.20, 0.40, 0.05]),
        'AptitudeTestScore': np.round(np.clip(np.random.normal(75.83, 4.5, n), 60, 90), 0).astype(int),
        'SoftSkillsRating': np.round(np.clip(np.random.normal(4.17, 0.3, n), 3.0, 4.8), 2),
        'ExtracurricularActivities': np.random.choice(['Yes', 'No'], n, p=[0.14, 0.86]),
        'PlacementTraining': np.random.choice(['Yes', 'No'], n, p=[0.40, 0.60]),
        'SSC_Marks': np.round(np.clip(np.random.normal(64.99, 5.5, n), 55, 90), 0).astype(int),
        'HSC_Marks': np.round(np.clip(np.random.normal(70.67, 5.0, n), 57, 88), 0).astype(int),
        'CodingScore': np.round(np.clip(np.random.normal(11, 4.5, n), 0, 30), 0).astype(int),
        'PlacementStatus': 'NotPlaced'
    })

df = pd.concat([gen_placed(n_placed), gen_not_placed(n_not_placed)], ignore_index=True)
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

print(f"Dataset shape: {df.shape}")
print(f"\nPlacement distribution:\n{df['PlacementStatus'].value_counts()}")
print(f"\nFeature statistics:")
for col in df.columns:
    if col == 'PlacementStatus':
        continue
    if df[col].dtype in ['float64', 'int64', 'int32']:
        placed = df[df['PlacementStatus']=='Placed'][col]
        not_placed = df[df['PlacementStatus']=='NotPlaced'][col]
        print(f"  {col}: range [{df[col].min()}, {df[col].max()}] | placed avg: {placed.mean():.2f} | not-placed avg: {not_placed.mean():.2f}")

df.to_csv('placementdata.csv', index=False)
print(f"\nSaved: placementdata.csv ({len(df)} rows)")
