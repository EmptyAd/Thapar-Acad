from pydantic import BaseModel
from datetime import date

class ResearchMetadata(BaseModel):
    title: str
    authors: str
    department: str
    publication_date: date
    journal: str
    keywords: str
