"""
Data Ingestion Service
Handles CSV and JSON data uploads with validation
"""
import pandas as pd
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)


class DataIngestionService:
    """Service for ingesting retail data from various sources"""
    
    REQUIRED_SALES_COLUMNS = ['date', 'product_id', 'quantity', 'revenue']
    REQUIRED_INVENTORY_COLUMNS = ['date', 'product_id', 'stock_level']
    REQUIRED_MARKET_COLUMNS = ['date', 'product_category', 'demand_forecast']
    
    def __init__(self):
        self.ingestion_id = None
        self.data_lineage = []
    
    async def ingest_csv(self, file_content: bytes, data_type: str) -> Dict[str, Any]:
        """
        Ingest CSV file and validate data
        
        Args:
            file_content: CSV file content as bytes
            data_type: Type of data (sales, inventory, market_trends)
        
        Returns:
            Dict with ingestion results and validated data
        """
        self.ingestion_id = str(uuid.uuid4())
        
        try:
            # Read CSV
            df = pd.read_csv(pd.io.common.BytesIO(file_content))
            
            # Validate based on data type
            validation_result = self._validate_dataframe(df, data_type)
            
            if not validation_result['valid']:
                return {
                    'success': False,
                    'ingestion_id': self.ingestion_id,
                    'errors': validation_result['errors'],
                    'data': None
                }
            
            # Process and clean data
            processed_data = self._process_dataframe(df, data_type)
            
            # Track lineage
            self._track_lineage(data_type, 'CSV', len(df))
            
            return {
                'success': True,
                'ingestion_id': self.ingestion_id,
                'data_type': data_type,
                'records_count': len(processed_data),
                'data': processed_data,
                'lineage': self.data_lineage
            }
            
        except Exception as e:
            logger.error(f"CSV ingestion error: {str(e)}")
            return {
                'success': False,
                'ingestion_id': self.ingestion_id,
                'errors': [str(e)],
                'data': None
            }
    
    async def ingest_json(self, json_data: Dict[str, Any], data_type: str) -> Dict[str, Any]:
        """
        Ingest JSON data and validate
        
        Args:
            json_data: JSON data as dictionary
            data_type: Type of data (sales, inventory, market_trends)
        
        Returns:
            Dict with ingestion results and validated data
        """
        self.ingestion_id = str(uuid.uuid4())
        
        try:
            # Convert JSON to DataFrame for validation
            if 'records' in json_data:
                df = pd.DataFrame(json_data['records'])
            else:
                df = pd.DataFrame([json_data])
            
            # Validate
            validation_result = self._validate_dataframe(df, data_type)
            
            if not validation_result['valid']:
                return {
                    'success': False,
                    'ingestion_id': self.ingestion_id,
                    'errors': validation_result['errors'],
                    'data': None
                }
            
            # Process data
            processed_data = self._process_dataframe(df, data_type)
            
            # Track lineage
            self._track_lineage(data_type, 'JSON', len(df))
            
            return {
                'success': True,
                'ingestion_id': self.ingestion_id,
                'data_type': data_type,
                'records_count': len(processed_data),
                'data': processed_data,
                'lineage': self.data_lineage
            }
            
        except Exception as e:
            logger.error(f"JSON ingestion error: {str(e)}")
            return {
                'success': False,
                'ingestion_id': self.ingestion_id,
                'errors': [str(e)],
                'data': None
            }
    
    def _validate_dataframe(self, df: pd.DataFrame, data_type: str) -> Dict[str, Any]:
        """Validate DataFrame based on data type"""
        errors = []
        
        # Check for empty DataFrame
        if df.empty:
            errors.append("DataFrame is empty")
            return {'valid': False, 'errors': errors}
        
        # Get required columns based on data type
        required_columns = self._get_required_columns(data_type)
        
        # Check for missing columns
        missing_columns = set(required_columns) - set(df.columns)
        if missing_columns:
            errors.append(f"Missing required columns: {missing_columns}")
        
        # Check for null values in required columns
        for col in required_columns:
            if col in df.columns and df[col].isnull().any():
                errors.append(f"Column '{col}' contains null values")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }
    
    def _get_required_columns(self, data_type: str) -> List[str]:
        """Get required columns for data type"""
        if data_type == 'sales':
            return self.REQUIRED_SALES_COLUMNS
        elif data_type == 'inventory':
            return self.REQUIRED_INVENTORY_COLUMNS
        elif data_type == 'market_trends':
            return self.REQUIRED_MARKET_COLUMNS
        else:
            return []
    
    def _process_dataframe(self, df: pd.DataFrame, data_type: str) -> List[Dict[str, Any]]:
        """Process and clean DataFrame"""
        # Convert date columns to datetime
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
        
        # Convert to list of dictionaries
        return df.to_dict('records')
    
    def _track_lineage(self, data_type: str, source_format: str, record_count: int):
        """Track data lineage for audit purposes"""
        self.data_lineage.append({
            'ingestion_id': self.ingestion_id,
            'data_type': data_type,
            'source_format': source_format,
            'record_count': record_count,
            'timestamp': datetime.utcnow().isoformat()
        })
