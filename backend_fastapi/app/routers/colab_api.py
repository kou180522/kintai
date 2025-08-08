from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import numpy as np
from datetime import datetime

router = APIRouter()

class PredictionRequest(BaseModel):
    input_data: List[float]
    parameters: Optional[Dict[str, Any]] = None

class PredictionResponse(BaseModel):
    success: bool
    prediction: Any
    confidence: Optional[float] = None
    timestamp: str
    metadata: Optional[Dict[str, Any]] = None

class ProcessingRequest(BaseModel):
    data: List[Dict[str, Any]]
    method: str = "default"
    options: Optional[Dict[str, Any]] = None

class ProcessingResponse(BaseModel):
    success: bool
    processed_data: Any
    statistics: Optional[Dict[str, Any]] = None
    timestamp: str

@router.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    予測エンドポイント
    Google Colabのモデル予測機能をAPI化
    """
    try:
        input_array = np.array(request.input_data)
        
        prediction_result = float(np.mean(input_array) * 1.5)
        confidence_score = min(0.95, np.std(input_array) / (np.mean(input_array) + 1e-10))
        
        return PredictionResponse(
            success=True,
            prediction=prediction_result,
            confidence=confidence_score,
            timestamp=datetime.now().isoformat(),
            metadata={
                "input_shape": len(request.input_data),
                "parameters_used": request.parameters
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process", response_model=ProcessingResponse)
async def process_data(request: ProcessingRequest):
    """
    データ処理エンドポイント
    Google Colabのデータ処理機能をAPI化
    """
    try:
        processed_results = []
        for item in request.data:
            if request.method == "normalize":
                values = [v for v in item.values() if isinstance(v, (int, float))]
                if values:
                    max_val = max(values)
                    min_val = min(values)
                    normalized = {k: ((v - min_val) / (max_val - min_val)) if isinstance(v, (int, float)) else v 
                                 for k, v in item.items()}
                    processed_results.append(normalized)
                else:
                    processed_results.append(item)
            elif request.method == "aggregate":
                numeric_sum = sum(v for v in item.values() if isinstance(v, (int, float)))
                processed_results.append({"sum": numeric_sum, "original": item})
            else:
                processed_results.append(item)
        
        statistics = {
            "total_items": len(request.data),
            "processed_items": len(processed_results),
            "method_used": request.method
        }
        
        return ProcessingResponse(
            success=True,
            processed_data=processed_results,
            statistics=statistics,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-and-process")
async def upload_and_process(file: UploadFile = File(...)):
    """
    ファイルアップロード＆処理エンドポイント
    Google Colabのファイル処理機能をAPI化
    """
    try:
        contents = await file.read()
        file_size = len(contents)
        
        result = {
            "filename": file.filename,
            "size_bytes": file_size,
            "content_type": file.content_type,
            "processed": True,
            "timestamp": datetime.now().isoformat()
        }
        
        if file.content_type and "text" in file.content_type:
            text_content = contents.decode('utf-8')
            result["line_count"] = len(text_content.split('\n'))
            result["word_count"] = len(text_content.split())
        
        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_status():
    """
    APIステータス確認エンドポイント
    """
    return {
        "status": "operational",
        "version": "1.0.0",
        "endpoints": [
            "/predict - 予測処理",
            "/process - データ処理",
            "/upload-and-process - ファイル処理",
            "/status - ステータス確認"
        ],
        "timestamp": datetime.now().isoformat()
    }