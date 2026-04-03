"""
Train RandomForestClassifier using sklearn Pipeline with StandardScaler + OneHotEncoder.
Produces trained_pipeline_model.joblib and label_encoder.joblib.
Also saves a backward-compatible model.pkl for the Flask app.
"""
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib

def main():
    print("Loading dataset...")
    df = pd.read_csv('placementdata.csv')

    # Drop StudentID if present
    if 'StudentID' in df.columns:
        df = df.drop(columns=['StudentID'])

    X = df.drop(columns=['PlacementStatus'])
    y = df['PlacementStatus']

    # Identify feature types
    categorical_features = ['ExtracurricularActivities', 'PlacementTraining']
    numerical_features = [col for col in X.columns if col not in categorical_features]

    print(f"Numerical features ({len(numerical_features)}): {numerical_features}")
    print(f"Categorical features ({len(categorical_features)}): {categorical_features}")

    # Preprocessor — StandardScaler for numerics, OneHotEncoder for categoricals
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_features),
            ('cat', OneHotEncoder(drop='if_binary', sparse_output=False), categorical_features)
        ])

    # Encode target
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)  # NotPlaced→0, Placed→1
    print(f"Classes: {le.classes_} → [0, 1]")

    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )

    # Pipeline — preprocessor + classifier
    print("Building Pipeline: StandardScaler + OneHotEncoder + RandomForest(200 trees)...")
    pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(
            n_estimators=200,
            max_depth=12,
            min_samples_split=4,
            random_state=42,
            class_weight='balanced'
        ))
    ])

    print("Training...")
    pipeline.fit(X_train, y_train)

    # Evaluate
    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print("=" * 50)
    print(f"Model Accuracy: {accuracy * 100:.2f}%")
    print("=" * 50)
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    # Feature importances (from the classifier step)
    rf = pipeline.named_steps['classifier']
    # Get feature names after transformation
    num_names = numerical_features
    cat_names = list(pipeline.named_steps['preprocessor']
                     .named_transformers_['cat']
                     .get_feature_names_out(categorical_features))
    all_names = num_names + cat_names

    print("\nFeature Importances:")
    for feat, imp in sorted(zip(all_names, rf.feature_importances_), key=lambda x: -x[1]):
        print(f"  {feat}: {imp:.4f}")

    # Save pipeline model + label encoder
    joblib.dump(pipeline, 'trained_pipeline_model.joblib')
    joblib.dump(le, 'label_encoder.joblib')
    print(f"\nSaved: trained_pipeline_model.joblib, label_encoder.joblib")

if __name__ == "__main__":
    main()
