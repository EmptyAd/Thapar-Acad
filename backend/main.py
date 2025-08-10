import uuid
from fastapi import FastAPI, File, UploadFile, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from supabase_client import supabase
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BUCKET_NAME = "research-papers"
SUPABASE_URL = "https://your-project.supabase.co"  # replace with your actual Supabase project URL

@app.post("/upload")
async def upload_paper(
    title: str = Form(...),
    authors: str = Form(...),
    department: str = Form(...),
    publication_date: str = Form(...),
    journal: str = Form(...),
    keywords: str = Form(...),
    file: UploadFile = File(...)
):
    file_id = str(uuid.uuid4())
    file_path = f"{file_id}_{file.filename}"

    # Read file bytes
    file_bytes = await file.read()

    # Upload file to Supabase Storage
    supabase.storage.from_(BUCKET_NAME).upload(file_path, file_bytes)

    # Construct public file URL
    relative_path = supabase.storage.from_(BUCKET_NAME).get_public_url(file_path)
    file_url = f"{SUPABASE_URL}{relative_path}"

    # Insert metadata into Supabase DB
    data = {
        "title": title,
        "authors": authors,
        "department": department,
        "publication_date": publication_date,
        "journal": journal,
        "keywords": keywords,
        "file_url": file_url,
    }

    supabase.table("research_metadata").insert(data).execute()

    return {"message": "Upload successful", "file_url": file_url}

@app.get("/search")
async def search_papers(
    q: Optional[str] = Query(None, description="Search query"),
    department: Optional[str] = Query(None, description="Filter by department"),
    journal: Optional[str] = Query(None, description="Filter by journal"),
    year: Optional[str] = Query(None, description="Filter by publication year"),
    sort_by: Optional[str] = Query("publication_date", description="Sort by field (publication_date, title, authors)"),
    sort_order: Optional[str] = Query("desc", description="Sort order (asc, desc)"),
    limit: Optional[int] = Query(50, description="Maximum number of results")
):
    try:
        # Start with base query
        query = supabase.table("research_metadata").select("*")
        
        # Apply search filters
        if q:
            # Search across multiple fields using ilike (case-insensitive)
            search_term = f"%{q}%"
            query = query.or_(
                f"title.ilike.{search_term},"
                f"authors.ilike.{search_term},"
                f"keywords.ilike.{search_term},"
                f"journal.ilike.{search_term},"
                f"department.ilike.{search_term}"
            )
        
        # Apply additional filters
        if department:
            query = query.ilike("department", f"%{department}%")
        
        if journal:
            query = query.ilike("journal", f"%{journal}%")
        
        if year:
            # Filter by year from publication_date
            query = query.gte("publication_date", f"{year}-01-01").lte("publication_date", f"{year}-12-31")
        
        # Apply sorting
        if sort_order.lower() == "desc":
            query = query.order(sort_by, desc=True)
        else:
            query = query.order(sort_by, desc=False)
        
        # Apply limit
        query = query.limit(limit)
        
        # Execute query
        response = query.execute()
        
        return {
            "success": True,
            "papers": response.data,
            "count": len(response.data)
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "papers": [],
            "count": 0
        }

@app.get("/papers")
async def get_all_papers(
    limit: Optional[int] = Query(50, description="Maximum number of results"),
    offset: Optional[int] = Query(0, description="Number of results to skip")
):
    try:
        response = supabase.table("research_metadata").select("*").order("publication_date", desc=True).range(offset, offset + limit - 1).execute()
        
        return {
            "success": True,
            "papers": response.data,
            "count": len(response.data)
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "papers": [],
            "count": 0
        }

@app.get("/paper/{paper_id}")
async def get_paper_by_id(paper_id: int):
    try:
        response = supabase.table("research_metadata").select("*").eq("id", paper_id).execute()
        
        if response.data:
            return {
                "success": True,
                "paper": response.data[0]
            }
        else:
            return {
                "success": False,
                "error": "Paper not found"
            }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }