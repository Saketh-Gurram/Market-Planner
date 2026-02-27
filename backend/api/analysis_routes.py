"""
Analysis API routes (Risk, Simulation, Impact)
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from database import get_db
from services.seasonal_risk_engine import SeasonalRiskEngine
from services.failure_simulator import RetailFailureSimulator
from services.impact_analyzer import ImpactAnalyzer
from services.ai_reasoning_engine import AIReasoningEngine
from services.mitigation_engine import MitigationEngine
from models import RiskAssessment, FailureScenario, FailurePropagationScore, ExecutiveSummary, MitigationStrategy, SimulationResult
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/analysis", tags=["Analysis"])


@router.post("/risk/analyze")
async def analyze_risks(market_data: Dict[str, Any], db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Analyze seasonal risks from market data"""
    try:
        engine = SeasonalRiskEngine()
        risk_assessments = await engine.analyze_seasonal_risks(market_data.get('records', []))
        
        # Save to database
        saved_risks = []
        for risk in risk_assessments:
            db_risk = RiskAssessment(**risk)
            db.add(db_risk)
            saved_risks.append(risk)
        
        db.commit()
        
        return {
            'success': True,
            'risk_count': len(saved_risks),
            'risks': saved_risks
        }
    except Exception as e:
        logger.error(f"Risk analysis error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/simulate")
async def simulate_scenario(scenario_data: Dict[str, Any], db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Simulate failure scenario"""
    try:
        # Create scenario
        scenario_id = str(uuid.uuid4())
        scenario_data['scenario_id'] = scenario_id
        
        db_scenario = FailureScenario(
            scenario_id=scenario_id,
            scenario_type=scenario_data['scenario_type'],
            affected_products=scenario_data.get('affected_products', []),
            time_horizon=scenario_data.get('time_horizon', 30),
            initial_conditions=scenario_data.get('initial_conditions'),
            simulation_parameters=scenario_data.get('simulation_parameters')
        )
        db.add(db_scenario)
        
        # Run simulation
        simulator = RetailFailureSimulator()
        simulation_result = await simulator.simulate_scenario(scenario_data)
        
        if not simulation_result:
            raise HTTPException(status_code=500, detail="Simulation failed")
        
        # Save simulation result
        db_result = SimulationResult(**simulation_result)
        db.add(db_result)
        
        # Run impact analysis
        analyzer = ImpactAnalyzer()
        impact_result = await analyzer.analyze_impact(scenario_data, simulation_result)
        
        if impact_result:
            db_impact = FailurePropagationScore(**impact_result)
            db.add(db_impact)
            
            # Generate executive summary
            ai_engine = AIReasoningEngine()
            summary = await ai_engine.generate_executive_summary(
                scenario_data,
                impact_result,
                simulation_result
            )
            
            if summary:
                db_summary = ExecutiveSummary(**summary)
                db.add(db_summary)
            
            # Generate mitigation strategies
            mitigation_engine = MitigationEngine()
            strategies = await mitigation_engine.generate_strategies(
                scenario_data,
                impact_result
            )
            
            for strategy in strategies:
                db_strategy = MitigationStrategy(**strategy)
                db.add(db_strategy)
        
        db.commit()
        
        return {
            'success': True,
            'scenario_id': scenario_id,
            'simulation': simulation_result,
            'impact': impact_result,
            'summary': summary if impact_result else None,
            'strategies': strategies if impact_result else []
        }
        
    except Exception as e:
        logger.error(f"Simulation error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scenarios")
async def get_scenarios(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Get all scenarios"""
    try:
        scenarios = db.query(FailureScenario).order_by(FailureScenario.created_timestamp.desc()).limit(50).all()
        return [s.to_dict() for s in scenarios]
    except Exception as e:
        logger.error(f"Get scenarios error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scenarios/{scenario_id}")
async def get_scenario_details(scenario_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get detailed scenario information"""
    try:
        scenario = db.query(FailureScenario).filter(FailureScenario.scenario_id == scenario_id).first()
        if not scenario:
            raise HTTPException(status_code=404, detail="Scenario not found")
        
        simulation = db.query(SimulationResult).filter(SimulationResult.scenario_id == scenario_id).first()
        impact = db.query(FailurePropagationScore).filter(FailurePropagationScore.scenario_id == scenario_id).first()
        summary = db.query(ExecutiveSummary).filter(ExecutiveSummary.scenario_id == scenario_id).first()
        strategies = db.query(MitigationStrategy).filter(MitigationStrategy.scenario_id == scenario_id).all()
        
        return {
            'scenario': scenario.to_dict(),
            'simulation': simulation.to_dict() if simulation else None,
            'impact': impact.to_dict() if impact else None,
            'summary': summary.to_dict() if summary else None,
            'strategies': [s.to_dict() for s in strategies]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get scenario details error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/risks")
async def get_risks(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Get all risk assessments"""
    try:
        risks = db.query(RiskAssessment).order_by(RiskAssessment.detection_timestamp.desc()).limit(100).all()
        return [r.to_dict() for r in risks]
    except Exception as e:
        logger.error(f"Get risks error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
