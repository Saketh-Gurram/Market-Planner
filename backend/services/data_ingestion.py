"""
Data Ingestion Service
Handles CSV, Excel, and JSON data uploads with validation.

Supported data types:
  sales           – date, product_id, quantity, revenue
  inventory       – date, product_id, stock_level
  market_trends   – date, product_category, demand_forecast
  enterprise      – full 17-column enterprise retail risk dataset
                    (date, region, store_id, product_id, product_category,
                     price, demand, actual_sales, lost_sales, revenue,
                     stock_level, replenishment_qty, holding_cost,
                     stockout_flag, overstock_flag, seller_quality_score,
                     promotion_flag)
"""
import io
import json
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# ── Required column definitions ───────────────────────────────────────────────
REQUIRED_COLUMNS = {
    "sales": ["date", "product_id", "quantity", "revenue"],
    "inventory": ["date", "product_id", "stock_level"],
    "market_trends": ["date", "product_category", "demand_forecast"],
    "enterprise": [
        "date", "region", "store_id", "product_id", "product_category",
        "price", "demand", "actual_sales", "lost_sales", "revenue",
        "stock_level", "replenishment_qty", "holding_cost",
        "stockout_flag", "overstock_flag", "seller_quality_score",
        "promotion_flag",
    ],
}

# Chunk size for large file reading (rows per chunk)
_CHUNK_SIZE = 50_000
# Maximum rows to return in the 'data' payload (summary sample for UI)
_SAMPLE_ROWS = 500


class DataIngestionService:
    """Service for ingesting retail data from various sources."""

    def __init__(self):
        self.ingestion_id: Optional[str] = None
        self.data_lineage: List[Dict[str, Any]] = []

    # ── File reading ──────────────────────────────────────────────────────────

    def _read_file_to_df(self, content: bytes, filename: str) -> pd.DataFrame:
        """Auto-detect CSV vs Excel by filename extension and parse."""
        ext = (filename or "").lower().rsplit(".", 1)[-1]
        if ext in ("xlsx", "xls"):
            return pd.read_excel(io.BytesIO(content), engine="openpyxl")
        return pd.read_csv(io.BytesIO(content))

    def _read_large_csv_chunked(self, content: bytes) -> pd.DataFrame:
        """Read a large CSV in chunks to avoid OOM; return combined DataFrame."""
        chunks = pd.read_csv(io.BytesIO(content), chunksize=_CHUNK_SIZE)
        return pd.concat(list(chunks), ignore_index=True)

    # ── Public ingestion API ──────────────────────────────────────────────────

    async def ingest_csv(
        self,
        file_content: bytes,
        data_type: str,
        filename: str = "upload.csv",
    ) -> Dict[str, Any]:
        """
        Ingest CSV or Excel file and validate.
        For the 'enterprise' type, performs chunked reading and returns
        aggregated statistics alongside a sample.
        """
        self.ingestion_id = str(uuid.uuid4())

        try:
            # ── Read file ─────────────────────────────────────────────────────
            ext = (filename or "").lower().rsplit(".", 1)[-1]
            fmt = "EXCEL" if ext in ("xlsx", "xls") else "CSV"

            if data_type == "enterprise" and fmt == "CSV":
                df = self._read_large_csv_chunked(file_content)
            else:
                df = self._read_file_to_df(file_content, filename)

            # ── Validate ──────────────────────────────────────────────────────
            validation = self._validate_dataframe(df, data_type)
            if not validation["valid"]:
                return {
                    "success": False,
                    "ingestion_id": self.ingestion_id,
                    "errors": validation["errors"],
                    "data": None,
                }

            # ── Process ───────────────────────────────────────────────────────
            if data_type == "enterprise":
                result = self._process_enterprise(df)
            else:
                result = {
                    "records": self._process_dataframe(df, data_type),
                    "aggregate_stats": None,
                    "category_stats": None,
                    "region_stats": None,
                    "simulation_seeds": None,
                }

            self._track_lineage(data_type, fmt, len(df))

            return {
                "success": True,
                "ingestion_id": self.ingestion_id,
                "data_type": data_type,
                "records_count": len(df),
                "data": result["records"],
                "aggregate_stats": result.get("aggregate_stats"),
                "category_stats": result.get("category_stats"),
                "region_stats": result.get("region_stats"),
                "simulation_seeds": result.get("simulation_seeds"),
                "store_stats": result.get("store_stats"),
                "lineage": self.data_lineage,
            }

        except Exception as exc:
            logger.error(f"CSV ingestion error: {exc}", exc_info=True)
            return {
                "success": False,
                "ingestion_id": self.ingestion_id,
                "errors": [str(exc)],
                "data": None,
            }

    async def ingest_json(
        self, json_data: Dict[str, Any], data_type: str
    ) -> Dict[str, Any]:
        """Ingest JSON data and validate."""
        self.ingestion_id = str(uuid.uuid4())

        try:
            records = json_data.get("records", [json_data])
            df = pd.DataFrame(records)

            validation = self._validate_dataframe(df, data_type)
            if not validation["valid"]:
                return {
                    "success": False,
                    "ingestion_id": self.ingestion_id,
                    "errors": validation["errors"],
                    "data": None,
                }

            if data_type == "enterprise":
                result = self._process_enterprise(df)
            else:
                result = {
                    "records": self._process_dataframe(df, data_type),
                    "aggregate_stats": None,
                    "category_stats": None,
                    "region_stats": None,
                    "simulation_seeds": None,
                }

            self._track_lineage(data_type, "JSON", len(df))

            return {
                "success": True,
                "ingestion_id": self.ingestion_id,
                "data_type": data_type,
                "records_count": len(df),
                "data": result["records"],
                "aggregate_stats": result.get("aggregate_stats"),
                "category_stats": result.get("category_stats"),
                "region_stats": result.get("region_stats"),
                "simulation_seeds": result.get("simulation_seeds"),
                "store_stats": result.get("store_stats"),
                "lineage": self.data_lineage,
            }

        except Exception as exc:
            logger.error(f"JSON ingestion error: {exc}", exc_info=True)
            return {
                "success": False,
                "ingestion_id": self.ingestion_id,
                "errors": [str(exc)],
                "data": None,
            }

    # ── Validation ────────────────────────────────────────────────────────────

    def _validate_dataframe(self, df: pd.DataFrame, data_type: str) -> Dict[str, Any]:
        errors: List[str] = []

        if df.empty:
            return {"valid": False, "errors": ["DataFrame is empty"]}

        required = REQUIRED_COLUMNS.get(data_type, [])
        missing = set(required) - set(df.columns)
        if missing:
            errors.append(f"Missing required columns: {sorted(missing)}")

        for col in required:
            if col in df.columns and df[col].isnull().any():
                null_count = int(df[col].isnull().sum())
                errors.append(f"Column '{col}' contains {null_count} null values")

        return {"valid": len(errors) == 0, "errors": errors}

    # ── Standard processing ───────────────────────────────────────────────────

    def _process_dataframe(self, df: pd.DataFrame, data_type: str) -> List[Dict[str, Any]]:
        if "date" in df.columns:
            df = df.copy()
            df["date"] = pd.to_datetime(df["date"])
        return json.loads(df.to_json(orient="records", date_format="iso"))

    # ── Enterprise processing ─────────────────────────────────────────────────

    def _process_enterprise(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Full enterprise dataset processing.

        Returns:
          records        – sample rows (≤ _SAMPLE_ROWS) for UI preview
          aggregate_stats – global dataset metrics
          category_stats  – per product_category risk signals
          region_stats    – per region risk signals
          simulation_seeds – per-category parameters for seeding simulation
          store_stats    – per store×category signals for transfer optimization
        """
        df = df.copy()
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
        numeric_cols = [
            "price", "demand", "actual_sales", "lost_sales", "revenue",
            "stock_level", "replenishment_qty", "holding_cost",
            "stockout_flag", "overstock_flag", "seller_quality_score", "promotion_flag",
        ]
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

        sample_df = df.head(_SAMPLE_ROWS)
        records = json.loads(sample_df.to_json(orient="records", date_format="iso"))

        aggregate_stats = self._compute_aggregate_stats(df)
        category_stats = self._compute_category_stats(df)
        region_stats = self._compute_region_stats(df)
        simulation_seeds = self._compute_simulation_seeds(df)
        store_stats = self._compute_store_stats(df)

        return {
            "records": records,
            "aggregate_stats": aggregate_stats,
            "category_stats": category_stats,
            "region_stats": region_stats,
            "simulation_seeds": simulation_seeds,
            "store_stats": store_stats,
        }

    @staticmethod
    def _compute_aggregate_stats(df: pd.DataFrame) -> Dict[str, Any]:
        total_revenue = float(df["revenue"].sum())
        total_lost_sales_value = float((df["lost_sales"] * df["price"]).sum())
        total_holding_cost = float(df["holding_cost"].sum())
        total_demand = int(df["demand"].sum())
        total_actual_sales = int(df["actual_sales"].sum())
        fulfillment_rate = total_actual_sales / total_demand if total_demand > 0 else 1.0
        date_range = None
        if "date" in df.columns and df["date"].notna().any():
            date_range = {
                "start": str(df["date"].min().date()),
                "end": str(df["date"].max().date()),
                "days": int((df["date"].max() - df["date"].min()).days + 1),
            }
        return {
            "total_records": len(df),
            "date_range": date_range,
            "unique_products": int(df["product_id"].nunique()),
            "unique_stores": int(df["store_id"].nunique()),
            "unique_regions": int(df["region"].nunique()),
            "unique_categories": int(df["product_category"].nunique()),
            "total_revenue": round(total_revenue, 2),
            "total_lost_sales_value": round(total_lost_sales_value, 2),
            "total_holding_cost": round(total_holding_cost, 2),
            "fulfillment_rate": round(fulfillment_rate, 4),
            "stockout_rate": round(float(df["stockout_flag"].mean()), 4),
            "overstock_rate": round(float(df["overstock_flag"].mean()), 4),
            "avg_seller_quality": round(float(df["seller_quality_score"].mean()), 4),
            "promotion_rate": round(float(df["promotion_flag"].mean()), 4),
        }

    @staticmethod
    def _compute_category_stats(df: pd.DataFrame) -> List[Dict[str, Any]]:
        grouped = df.groupby("product_category")
        stats = []
        for cat, grp in grouped:
            demand_series = grp.groupby("date")["demand"].sum() if "date" in grp.columns else grp["demand"]
            cv = float(demand_series.std() / demand_series.mean()) if demand_series.mean() > 0 else 0.0
            total_demand = int(grp["demand"].sum())
            total_lost = float((grp["lost_sales"] * grp["price"]).sum())
            stats.append({
                "product_category": str(cat),
                "avg_demand": round(float(grp["demand"].mean()), 2),
                "demand_cv": round(cv, 4),
                "avg_price": round(float(grp["price"].mean()), 2),
                "avg_stock_level": round(float(grp["stock_level"].mean()), 2),
                "avg_holding_cost": round(float(grp["holding_cost"].mean()), 2),
                "total_holding_cost": round(float(grp["holding_cost"].sum()), 2),
                "stockout_rate": round(float(grp["stockout_flag"].mean()), 4),
                "overstock_rate": round(float(grp["overstock_flag"].mean()), 4),
                "avg_lost_sales_units": round(float(grp["lost_sales"].mean()), 4),
                "lost_sales_value": round(total_lost, 2),
                "avg_seller_quality": round(float(grp["seller_quality_score"].mean()), 4),
                "promotion_rate": round(float(grp["promotion_flag"].mean()), 4),
                "total_revenue": round(float(grp["revenue"].sum()), 2),
                "fulfillment_rate": round(
                    float(grp["actual_sales"].sum()) / total_demand if total_demand > 0 else 1.0, 4
                ),
            })
        return stats

    @staticmethod
    def _compute_region_stats(df: pd.DataFrame) -> List[Dict[str, Any]]:
        grouped = df.groupby("region")
        stats = []
        for region, grp in grouped:
            total_demand = int(grp["demand"].sum())
            stats.append({
                "region": str(region),
                "unique_stores": int(grp["store_id"].nunique()),
                "avg_demand": round(float(grp["demand"].mean()), 2),
                "total_revenue": round(float(grp["revenue"].sum()), 2),
                "total_holding_cost": round(float(grp["holding_cost"].sum()), 2),
                "stockout_rate": round(float(grp["stockout_flag"].mean()), 4),
                "overstock_rate": round(float(grp["overstock_flag"].mean()), 4),
                "avg_lost_sales_units": round(float(grp["lost_sales"].mean()), 4),
                "lost_sales_value": round(float((grp["lost_sales"] * grp["price"]).sum()), 2),
                "avg_seller_quality": round(float(grp["seller_quality_score"].mean()), 4),
                "fulfillment_rate": round(
                    float(grp["actual_sales"].sum()) / total_demand if total_demand > 0 else 1.0, 4
                ),
            })
        return stats

    @staticmethod
    def _compute_store_stats(df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Per store × product_category aggregated signals for transfer optimization.
        Returns a flat list — one entry per (store_id, product_category) pair.
        """
        grouped = df.groupby(["store_id", "product_category"])
        stats = []
        for (store_id, category), grp in grouped:
            total_demand = int(grp["demand"].sum())
            region = str(grp["region"].iloc[0]) if "region" in grp.columns else ""
            stats.append({
                "store_id": str(store_id),
                "region": region,
                "product_category": str(category),
                "avg_stock_level": round(float(grp["stock_level"].mean()), 2),
                "avg_demand": round(float(grp["demand"].mean()), 2),
                "avg_price": round(float(grp["price"].mean()), 2),
                "avg_holding_cost": round(float(grp["holding_cost"].mean()), 4),
                "stockout_rate": round(float(grp["stockout_flag"].mean()), 4),
                "overstock_rate": round(float(grp["overstock_flag"].mean()), 4),
                "avg_lost_sales_units": round(float(grp["lost_sales"].mean()), 4),
                "total_revenue": round(float(grp["revenue"].sum()), 2),
                "fulfillment_rate": round(
                    float(grp["actual_sales"].sum()) / total_demand if total_demand > 0 else 1.0, 4
                ),
            })
        return stats

    @staticmethod
    def _compute_simulation_seeds(df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Compute per-category parameters for seeding the simulation engine
        from real data.
        """
        grouped = df.groupby("product_category")
        seeds = []
        for cat, grp in grouped:
            avg_demand = float(grp["demand"].mean())
            std_demand = float(grp["demand"].std())
            avg_price = float(grp["price"].mean())
            avg_stock = float(grp["stock_level"].mean())
            stockout_rate = float(grp["stockout_flag"].mean())
            overstock_rate = float(grp["overstock_flag"].mean())

            # Determine dominant risk type from actual data
            if stockout_rate > 0.05:
                dominant_scenario = "STOCKOUT"
            elif overstock_rate > 0.50:
                dominant_scenario = "OVERSTOCK"
            elif grp["promotion_flag"].mean() > 0.20:
                dominant_scenario = "SEASONAL_MISMATCH"
            else:
                dominant_scenario = "OVERSTOCK"

            seeds.append({
                "product_category": str(cat),
                "dominant_scenario": dominant_scenario,
                "simulation_parameters": {
                    "demand_rate": round(avg_demand, 2),
                    "demand_std": round(std_demand, 2),
                    "demand_cv": round(std_demand / avg_demand if avg_demand > 0 else 0, 4),
                    "stockout_factor": round(
                        max(0.1, 1.0 - stockout_rate * 10), 2
                    ),
                    "overstock_factor": round(
                        min(3.0, 1.0 + overstock_rate * 2), 2
                    ),
                    "price_elasticity": 1.0,
                    "fulfillment_capacity": round(
                        float(grp["seller_quality_score"].mean()) + 0.5, 2
                    ),
                },
                "initial_conditions": {
                    "base_inventory": round(avg_stock, 0),
                    "unit_price": round(avg_price, 2),
                },
            })
        return seeds

    # ── Lineage tracking ──────────────────────────────────────────────────────

    def _track_lineage(self, data_type: str, source_format: str, record_count: int):
        self.data_lineage.append({
            "ingestion_id": self.ingestion_id,
            "data_type": data_type,
            "source_format": source_format,
            "record_count": record_count,
            "timestamp": datetime.utcnow().isoformat(),
        })

    # ── Compatibility alias ───────────────────────────────────────────────────

    def _get_required_columns(self, data_type: str) -> List[str]:
        return REQUIRED_COLUMNS.get(data_type, [])
