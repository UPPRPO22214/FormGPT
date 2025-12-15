from pydantic import BaseModel, Field


class ChoiceStats(BaseModel):
    options: list[str] = Field(..., description="List of options")
    counts: list[int] = Field(..., description="List of counts")
    percentages: list[float] = Field(..., description="List of percentages")

class ScaleStats(BaseModel):
    min: int = Field(..., description="Minimum value")
    max: int = Field(..., description="Maximum value")
    average: float = Field(..., description="Average value")
    distribution: list[int] = Field(..., description="Distribution of values")
    median: float = Field(..., description="Median value")

class TextStats(BaseModel):
    totalAnswers: int = Field(..., description="Total number of responses")
    wordCloud: list[str] = Field(..., description="Word cloud of responses")
    sampleAnswers: list[str] = Field(..., description="Sample of responses")
