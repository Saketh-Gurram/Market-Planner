"""
Data Ingestion API routes
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict, Any
from services.data_ingestion import DataIngestionService
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/data", tags=["Data Ingestion"])


@router.post("/upload/csv/{data_type}")
async def upload_csv(data_type: str, file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Upload CSV file for data ingestion
    
    Args:
        data_type: Type of data (sales, inventory, market_trends)
        file: CSV file
    
    Returns:
        Ingestion result
    """
    if data_type not in ['sales', 'inventory', 'market_trends']:
        raise HTTPException(status_code=400, detail="Invalid data type")
    
    try:
        content = await file.read()
        service = DataIngestionService()
        result = await service.ingest_csv(content, data_type)
        
        if not result['success']:
            raise HTTPException(status_code=400, detail=result['errors'])
        
        return result
    except Exception as e:
        logger.error(f"CSV upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload/json/{data_type}")
async def upload_json(data_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Upload JSON data for ingestion
    
    Args:
        data_type: Type of data (sales, inventory, market_trends)
        data: JSON data
    
    Returns:
        Ingestion result
    """
    if data_type not in ['sales', 'inventory', 'market_trends']:
        raise HTTPException(status_code=400, detail="Invalid data type")
    
    try:
        service = DataIngestionService()
        result = await service.ingest_json(data, data_type)
        
        if not result['success']:
            raise HTTPException(status_code=400, detail=result['errors'])
        
        return result
    except Exception as e:
        logger.error(f"JSON upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
