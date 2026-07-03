"""
WebSocket Application for Real-time Features
"""

import os
import json
import logging
from typing import Dict, List, Optional, Set
from datetime import datetime, timezone
from fastapi import WebSocket, WebSocketDisconnect, APIRouter, HTTPException, status
from fastapi.websockets import WebSocketState
import asyncio
import jwt

from config.database import SessionLocal
from middleware.auth import SECRET_KEY, ALGORITHM, verify_token
from ai_ml.burnout import burnout_predictor

logger = logging.getLogger(__name__)
router = APIRouter()

# WebSocket connections storage
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.subscriptions: Dict[str, Set[str]] = {}  # user_id -> set of channel_ids
        self.channels: Dict[str, Set[WebSocket]] = {}  # channel_id -> set of connections

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"WebSocket connected: {user_id}")

    async def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            logger.info(f"WebSocket disconnected: {user_id}")

    async def send_to_user(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except Exception as e:
                logger.error(f"Error sending to {user_id}: {e}")
                await self.disconnect(user_id)

    async def broadcast(self, message: dict, exclude: Set[str] = None):
        disconnected = set()
        for user_id, websocket in self.active_connections.items():
            if exclude and user_id in exclude:
                continue
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting: {e}")
                disconnected.add(user_id)
        
        for user_id in disconnected:
            await self.disconnect(user_id)

    def subscribe(self, user_id: str, channel_id: str):
        if user_id not in self.subscriptions:
            self.subscriptions[user_id] = set()
        self.subscriptions[user_id].add(channel_id)
        
        if channel_id not in self.channels:
            self.channels[channel_id] = set()
        self.channels[channel_id].add(self.active_connections[user_id])

    def unsubscribe(self, user_id: str, channel_id: str):
        if user_id in self.subscriptions:
            self.subscriptions[user_id].discard(channel_id)
        
        if channel_id in self.channels:
            self.channels[channel_id].discard(self.active_connections[user_id])


# Global connection manager
manager = ConnectionManager()


async def check_burnout_alerts():
    """Background task to check burnout alerts"""
    while True:
        try:
            # Check employees with high burnout scores
            db = SessionLocal()
            # This would query employees with high burnout scores
            # For now, just a placeholder
            db.close()
            
            await asyncio.sleep(3600)  # Check every hour
        except Exception as e:
            logger.error(f"Error in burnout check: {e}")
            await asyncio.sleep(60)


@router.websocket("")
async def websocket_endpoint(websocket: WebSocket, token: str = ""):
    """WebSocket endpoint for real-time features. Authenticates via JWT token query param."""
    # Authenticate: extract and verify JWT token
    if not token:
        await websocket.close(code=4001, reason="Missing authentication token")
        return
    try:
        payload = verify_token(token)
        user_id = payload.get("user_id")
        if not user_id:
            await websocket.close(code=4001, reason="Invalid token payload")
            return
    except HTTPException:
        await websocket.close(code=4001, reason="Invalid or expired token")
        return
    except Exception as e:
        logger.error(f"WebSocket auth error: {e}")
        await websocket.close(code=4001, reason="Authentication failed")
        return

    await manager.connect(websocket, user_id)

    try:
        while True:
            # Wait for messages
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                action = message.get("action")
                
                if action == "subscribe":
                    channel = message.get("channel")
                    if channel:
                        manager.subscribe(user_id, channel)
                        await manager.send_to_user(user_id, {
                            "type": "subscribed",
                            "channel": channel
                        })
                
                elif action == "unsubscribe":
                    channel = message.get("channel")
                    if channel:
                        manager.unsubscribe(user_id, channel)
                        await manager.send_to_user(user_id, {
                            "type": "unsubscribed",
                            "channel": channel
                        })
                
                elif action == "ping":
                    await manager.send_to_user(user_id, {
                        "type": "pong",
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    })
                
                else:
                    await manager.send_to_user(user_id, {
                        "type": "error",
                        "message": f"Unknown action: {action}"
                    })
            
            except json.JSONDecodeError:
                await manager.send_to_user(user_id, {
                    "type": "error",
                    "message": "Invalid JSON"
                })
    
    except WebSocketDisconnect:
        await manager.disconnect(user_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await manager.disconnect(user_id)


async def send_shift_update(org_id: str, shift_id: str, shift_data: dict):
    """Send shift update to all subscribers"""
    message = {
        "type": "shift_update",
        "org_id": org_id,
        "shift_id": shift_id,
        "data": shift_data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    # Broadcast to all connected clients
    await manager.broadcast(message)


async def send_swap_request(org_id: str, requester_id: str, swap_data: dict):
    """Send swap request notification"""
    message = {
        "type": "swap_request",
        "org_id": org_id,
        "requester_id": requester_id,
        "data": swap_data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    # Send to responder
    await manager.send_to_user(swap_data.get("responder_id"), message)


async def send_burnout_alert(org_id: str, employee_id: str, alert_data: dict):
    """Send burnout alert"""
    message = {
        "type": "burnout_alert",
        "org_id": org_id,
        "employee_id": employee_id,
        "data": alert_data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    # Send to employee and their manager
    await manager.send_to_user(employee_id, message)
    await manager.send_to_user(alert_data.get("manager_id"), message)


async def send_coverage_gap(org_id: str, department_id: str, gap_data: dict):
    """Send coverage gap notification"""
    message = {
        "type": "coverage_gap",
        "org_id": org_id,
        "department_id": department_id,
        "data": gap_data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    # Broadcast to relevant staff
    await manager.broadcast(message)


# Startup task
async def startup():
    """Start background tasks"""
    asyncio.create_task(check_burnout_alerts())
