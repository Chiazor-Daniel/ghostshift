"""
Burnout Prediction Model using LightGBM
"""

import os
import pickle
import numpy as np
import pandas as pd
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class BurnoutPredictor:
    def __init__(self):
        self.model_path = os.getenv("BURNOUT_MODEL_PATH", "models/burnout_model.pkl")
        self.model = None
        self.feature_columns = [
            'hours_worked_week',
            'hours_worked_month',
            'overtime_hours',
            'consecutive_shifts',
            'shifts_per_week',
            'days_since_rest',
            'age',
            'tenure_months',
            'night_shifts',
            'weekend_shifts',
            'leave_used',
            'leave_remaining',
            'rating',
            'coverage_gap_count',
            'swap_requests',
            'shift_changes'
        ]
        self._load_model()

    def _load_model(self):
        """Load trained LightGBM model"""
        try:
            if os.path.exists(self.model_path):
                with open(self.model_path, 'rb') as f:
                    self.model = pickle.load(f)
                logger.info("Burnout model loaded successfully")
            else:
                logger.warning("Burnout model not found, will train on first use")
        except Exception as e:
            logger.error(f"Error loading burnout model: {e}")

    def predict(self, employee_data: Dict) -> Dict:
        """Predict burnout risk for an employee.
        If no trained model exists, returns a transparent rule-based fallback."""
        try:
            # Prepare features
            features = self._prepare_features(employee_data)

            if not self.model:
                # Rule-based fallback when no trained model is available.
                # We still give useful guidance, but we tell the UI this is not ML.
                hours_week = employee_data.get('hours_worked_week', 40)
                consecutive = employee_data.get('consecutive_shifts', 0)
                days_rest = employee_data.get('days_since_rest', 1)
                overtime = employee_data.get('overtime_hours', 0)

                score = 30
                if hours_week > 40:
                    score += min((hours_week - 40) * 3, 25)
                if consecutive >= 6:
                    score += 20
                elif consecutive >= 4:
                    score += 10
                if days_rest >= 7:
                    score += 10
                if overtime > 10:
                    score += 10
                score = min(100, max(0, score))

                return {
                    "burnout_score": score,
                    "risk_level": self._get_risk_level(score),
                    "model_trained": False,
                    "model": "rule-based",
                    "factors": self._analyze_factors(features),
                    "recommendations": self._get_recommendations(score)
                }

            # Make prediction
            prediction = self.model.predict(features.reshape(1, -1))[0]
            probability = self.model.predict_proba(features.reshape(1, -1))[0]

            # Convert to burnout score (0-100)
            burnout_score = int(prediction * 100)

            return {
                "burnout_score": burnout_score,
                "risk_level": self._get_risk_level(burnout_score),
                "probability_low": round(probability[0], 3),
                "probability_medium": round(probability[1], 3),
                "probability_high": round(probability[2], 3),
                "model_trained": True,
                "model": "lightgbm",
                "factors": self._analyze_factors(features),
                "recommendations": self._get_recommendations(burnout_score)
            }

        except Exception as e:
            logger.error(f"Error predicting burnout: {e}")
            return {
                "burnout_score": 50,
                "risk_level": "moderate",
                "model_trained": False,
                "model": "error",
                "error": str(e),
                "recommendations": self._get_recommendations(50)
            }

    def _prepare_features(self, employee_data: Dict) -> np.ndarray:
        """Prepare features from employee data"""
        features = [
            employee_data.get('hours_worked_week', 40),
            employee_data.get('hours_worked_month', 160),
            employee_data.get('overtime_hours', 0),
            employee_data.get('consecutive_shifts', 0),
            employee_data.get('shifts_per_week', 5),
            employee_data.get('days_since_rest', 1),
            employee_data.get('age', 30),
            employee_data.get('tenure_months', 12),
            employee_data.get('night_shifts', 0),
            employee_data.get('weekend_shifts', 0),
            employee_data.get('leave_used', 0),
            employee_data.get('leave_remaining', 0),
            employee_data.get('rating', 4),
            employee_data.get('coverage_gap_count', 0),
            employee_data.get('swap_requests', 0),
            employee_data.get('shift_changes', 0)
        ]
        return np.array(features)

    def _get_risk_level(self, score: int) -> str:
        """Get risk level from score"""
        if score < 30:
            return "low"
        elif score < 60:
            return "moderate"
        else:
            return "high"

    def _analyze_factors(self, features: np.ndarray) -> Dict:
        """Analyze which factors contribute to burnout"""
        factor_names = self.feature_columns
        factor_contributions = {}
        
        for i, factor in enumerate(factor_names):
            if i < len(features):
                factor_contributions[factor] = float(features[i])
        
        return factor_contributions

    def _get_recommendations(self, score: int) -> List[str]:
        """Get recommendations based on burnout score"""
        recommendations = []
        
        if score >= 70:
            recommendations.append("Urgent: Consider immediate schedule adjustment")
            recommendations.append("Recommend mandatory time off or shift reduction")
            recommendations.append("Connect with employee wellness resources")
        elif score >= 40:
            recommendations.append("Monitor schedule closely for next 2 weeks")
            recommendations.append("Consider reducing night shifts")
            recommendations.append("Encourage regular breaks and rest periods")
        else:
            recommendations.append("Maintain current schedule")
            recommendations.append("Continue monitoring for changes")
        
        return recommendations

    def train(self, training_data: pd.DataFrame, target_column: str = 'burnout_score'):
        """Train the model with new data"""
        try:
            import lightgbm as lgb
            
            # Prepare data
            X = training_data.drop(columns=[target_column])
            y = training_data[target_column]
            
            # Create dataset
            train_data = lgb.Dataset(X, label=y)
            
            # Train model
            params = {
                'objective': 'binary',
                'metric': 'auc',
                'num_leaves': 31,
                'learning_rate': 0.05,
                'feature_fraction': 0.9
            }
            
            self.model = lgb.train(params, train_data, num_boost_round=100)
            
            # Save model
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            with open(self.model_path, 'wb') as f:
                pickle.dump(self.model, f)
            
            logger.info("Burnout model trained and saved successfully")
            
        except ImportError:
            logger.error("LightGBM not installed. Install with: pip install lightgbm")
        except Exception as e:
            logger.error(f"Error training burnout model: {e}")


# Global instance
burnout_predictor = BurnoutPredictor()
