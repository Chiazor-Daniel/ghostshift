"""
AI Assistant Integration - Supports Groq, OpenAI, and Ollama
"""

import os
import logging
from typing import Dict, List, Optional
from openai import OpenAI

logger = logging.getLogger(__name__)


class AIAssistant:
    def __init__(self):
        # Try Groq first (free tier, very fast)
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.ollama_api_key = os.getenv("OLLAMA_API_KEY")
        
        self.groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        self.openai_model = os.getenv("OPENAI_MODEL", "gpt-4o")
        self.ollama_model = os.getenv("OLLAMA_MODEL", "llama3:70b")
        
        # Groq model mapping (for decommissioned models)
        self.groq_model_map = {
            "llama3-70b-8192": "llama3-70b-8192",  # Still works
            "llama3-8b-8192": "llama3-8b-8192",
            "mixtral-8x7b-32768": "mixtral-8x7b-32768",
            "gemma-7b": "gemma-7b",
            "gemma2-9b": "gemma2-9b"
        }
        
        self.client = None
        self.provider = None
        
        # Initialize client based on available API
        if self.groq_api_key:
            try:
                self.client = OpenAI(api_key=self.groq_api_key, base_url="https://api.groq.com/openai/v1")
                self.provider = "groq"
                logger.info("Groq client initialized successfully")
            except Exception as e:
                logger.error(f"Error initializing Groq client: {e}")
        elif self.openai_api_key:
            try:
                self.client = OpenAI(api_key=self.openai_api_key)
                self.provider = "openai"
                logger.info("OpenAI client initialized successfully")
            except Exception as e:
                logger.error(f"Error initializing OpenAI client: {e}")
        elif self.ollama_api_key:
            try:
                self.client = OpenAI(api_key=self.ollama_api_key, base_url="https://api.ollama.com/v1")
                self.provider = "ollama"
                logger.info("Ollama client initialized successfully")
            except Exception as e:
                logger.error(f"Error initializing Ollama client: {e}")
        else:
            logger.warning("No AI API key configured - AI features will be limited")

    def generate_shift_recommendations(
        self,
        department_id: str,
        date: str,
        required_roles: List[str],
        hours_needed: int
    ) -> Dict:
        """Generate shift coverage recommendations"""
        if not self.client:
            return {"error": "OpenAI API not configured"}

        prompt = f"""
        You are an expert healthcare workforce scheduler. 
        Department ID: {department_id}
        Date: {date}
        Required Roles: {required_roles}
        Hours Needed: {hours_needed}

        Analyze the following:
        1. Staff availability for this date
        2. Staff qualifications and certifications
        3. Burnout risk scores
        4. Coverage gaps
        5. Optimal shift assignments

        Provide recommendations in JSON format:
        {{
            "recommended_staff": [
                {{"employee_id": "string", "name": "string", "role": "string", "confidence": 0.95}}
            ],
            "coverage_gaps": [
                {{"role": "string", "hours_missing": 4, "risk_level": "high"}}
            ],
            "suggested_actions": ["string"],
            "total_score": 0.85
        }}
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a healthcare workforce optimization expert."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            return {
                "success": True,
                "recommendations": response.choices[0].message.content,
                "model": self.model,
                "timestamp": "2026-06-29T10:00:00Z"
            }
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return {"error": str(e)}

    def analyze_burnout_risk(self, employee_data: Dict) -> Dict:
        """Analyze burnout risk using AI"""
        if not self.client:
            return {"error": "OpenAI API not configured"}

        prompt = f"""
        Analyze burnout risk for this employee:
        {employee_data}

        Provide:
        1. Risk assessment (low/medium/high)
        2. Contributing factors
        3. Specific recommendations
        4. Timeline for intervention
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a healthcare worker wellness expert."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            return {
                "success": True,
                "analysis": response.choices[0].message.content,
                "model": self.model
            }
            
        except Exception as e:
            logger.error(f"Error analyzing burnout risk: {e}")
            return {"error": str(e)}

    def generate_schedule_optimization(
        self,
        org_id: str,
        date_range: Dict,
        constraints: Dict
    ) -> Dict:
        """Generate optimized schedule"""
        if not self.client:
            return {"error": "OpenAI API not configured"}

        prompt = f"""
        Optimize schedule for organization {org_id}
        Date Range: {date_range}
        Constraints: {constraints}

        Provide optimized schedule with:
        1. Staff assignments
        2. Coverage optimization
        3. Cost efficiency
        4. Staff satisfaction
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a healthcare scheduling optimization expert."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1500
            )
            
            return {
                "success": True,
                "optimization": response.choices[0].message.content,
                "model": self.model
            }
            
        except Exception as e:
            logger.error(f"Error generating schedule optimization: {e}")
            return {"error": str(e)}

    def chat(self, message: str, context: Dict = None) -> Dict:
        """General chat interaction"""
        if not self.client:
            return {"error": "OpenAI API not configured"}

        system_prompt = """You are GhostShift AI Assistant, helping healthcare administrators 
        with workforce scheduling, burnout prevention, and staff management."""

        messages = [{"role": "system", "content": system_prompt}]
        
        if context:
            messages.append({"role": "context", "content": str(context)})
        
        messages.append({"role": "user", "content": message})

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=1000
            )
            
            return {
                "success": True,
                "response": response.choices[0].message.content,
                "model": self.model
            }
            
        except Exception as e:
            logger.error(f"Error in chat: {e}")
            return {"error": str(e)}


# Global instance
ai_assistant = AIAssistant()
