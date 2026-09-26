from pydantic import BaseModel
from typing import Optional, List

class RoomResponse(BaseModel):
    id: int
    ward_id: int
    room_number: str
    max_beds: int

    class Config:
        from_attributes = True

class WardResponse(BaseModel):
    id: int
    code: str
    name: str
    floor: str
    max_visitors_capacity: int
    rooms: Optional[List[RoomResponse]] = []

    class Config:
        from_attributes = True

class CheckpointResponse(BaseModel):
    id: int
    code: str
    name: str
    ward_id: Optional[int] = None
    checkpoint_type: str
    is_active: bool

    class Config:
        from_attributes = True
