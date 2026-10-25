"""
Production PyMongo & Motor MongoDB Atlas Connection Manager for ThaparElectiveAI ML Service.
"""
import logging
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import pymongo
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import MongoClient
from pymongo.database import Database
from app.config import MLServiceSettings, settings

logger = logging.getLogger("thapar-ml-atlas")


def mask_mongo_uri(uri: str) -> str:
    return re.sub(r"//([^:/@]+):([^@]+)@", "//***:***@", uri)


def create_pymongo_atlas_client(custom_settings: Optional[MLServiceSettings] = None) -> MongoClient:
    cfg = custom_settings or settings
    return pymongo.MongoClient(
        cfg.MONGODB_URI,
        maxPoolSize=20,
        minPoolSize=cfg.MONGODB_MIN_POOL_SIZE,
        serverSelectionTimeoutMS=5000,
        retryWrites=True,
        w="majority",
    )


class AtlasDatabaseManager:
    def __init__(self) -> None:
        self.async_client: Optional[AsyncIOMotorClient] = None
        self.async_db: Optional[AsyncIOMotorDatabase] = None
        self.sync_client: Optional[MongoClient] = None
        self.sync_db: Optional[Database] = None
        self.is_connected: bool = False
        self.last_error: Optional[str] = None

    async def connect(self, custom_settings: Optional[MLServiceSettings] = None) -> bool:
        cfg = custom_settings or settings
        if not cfg.has_live_atlas_uri or not cfg.MONGODB_URI:
            self.is_connected = False
            self.last_error = "MONGODB_URI not configured with live credentials; operating with processed dataset artifacts"
            logger.warning(self.last_error)
            return False

        masked = mask_mongo_uri(cfg.MONGODB_URI)
        try:
            logger.info("Connecting to remote MongoDB Atlas cluster (%s)...", masked)
            self.async_client = AsyncIOMotorClient(
                cfg.MONGODB_URI,
                maxPoolSize=20,
                minPoolSize=cfg.MONGODB_MIN_POOL_SIZE,
                serverSelectionTimeoutMS=5000,
                retryWrites=True,
                w="majority",
            )
            self.async_db = self.async_client[cfg.MONGODB_DB_NAME]

            self.sync_client = create_pymongo_atlas_client(cfg)
            self.sync_db = self.sync_client[cfg.MONGODB_DB_NAME]

            await self.async_client.admin.command("ping")
            self.is_connected = True
            self.last_error = None
            logger.info("Connected to MongoDB Atlas database '%s'", cfg.MONGODB_DB_NAME)
            return True
        except Exception as exc:
            self.is_connected = False
            self.last_error = str(exc)
            logger.warning("MongoDB Atlas connection unavailable (%s); using processed dataset artifacts", exc)
            return False

    def fetch_training_collection(self, collection_name: str, limit: int = 20000) -> List[Dict[str, Any]]:
        if self.sync_db is None or not self.is_connected:
            return []
        try:
            cursor = self.sync_db[collection_name].find({}, {"_id": 0}).limit(limit)
            return list(cursor)
        except Exception as exc:
            logger.warning("Failed reading collection '%s' from Atlas: %s", collection_name, exc)
            return []

    def record_model_registry_metrics(self, model_metadata: Dict[str, Any]) -> bool:
        if self.sync_db is None or not self.is_connected:
            return False
        try:
            doc = {
                **model_metadata,
                "logged_at": datetime.now(timezone.utc).isoformat(),
            }
            self.sync_db[settings.MODEL_REGISTRY_COLLECTION].update_one(
                {"model_version": doc.get("model_version", "tiet-hybrid-v2026.1.0")},
                {"$set": doc},
                upsert=True,
            )
            return True
        except Exception as exc:
            logger.warning("Failed writing model metrics to MongoDB Atlas: %s", exc)
            return False

    async def ping(self) -> Dict[str, Any]:
        if self.async_client is None or not self.is_connected:
            return {
                "connected": False,
                "status": "replica_artifact_sync",
                "detail": self.last_error or "Standby replica mode",
            }
        try:
            await self.async_client.admin.command("ping")
            return {"connected": True, "status": "ok"}
        except Exception as exc:
            self.is_connected = False
            self.last_error = str(exc)
            return {"connected": False, "status": "error", "detail": str(exc)}

    async def disconnect(self) -> None:
        if self.async_client is not None:
            self.async_client.close()
            self.async_client = None
        if self.sync_client is not None:
            self.sync_client.close()
            self.sync_client = None
        self.is_connected = False
        logger.info("Closed MongoDB Atlas connections in ML microservice")


db_manager = AtlasDatabaseManager()

