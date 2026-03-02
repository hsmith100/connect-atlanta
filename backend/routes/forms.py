"""
Forms API Routes
Handles all form submissions for the Connect Events website
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import psycopg2
import json
from decouple import config
from services.google_sheets_service import google_sheets_service
from services.email_service import EmailService

router = APIRouter(prefix="/api/forms", tags=["forms"])

# Initialize email service
email_service = EmailService()

# Database connection helper
def get_db_connection():
    """Create and return a database connection"""
    try:
        conn = psycopg2.connect(config("DATABASE_URL"))
        return conn
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database connection failed: {str(e)}"
        )

# Pydantic Models for Request Validation

class EmailSignupRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=50)
    marketing_consent: bool = False
    source: str = Field(default="website", max_length=50)

class VendorApplicationRequest(BaseModel):
    business_name: str = Field(..., min_length=1, max_length=255, alias="businessName")
    contact_name: str = Field(..., min_length=1, max_length=255, alias="contactName")
    email: EmailStr
    phone: str = Field(..., min_length=1, max_length=50)
    business_type: str = Field(..., min_length=1, max_length=100, alias="businessType")
    description: str = Field(..., min_length=1)
    website_social: str = Field(..., min_length=1, alias="websiteSocial")
    price_point: str = Field(..., min_length=1, alias="pricePoint")
    has_insurance: str = Field(..., min_length=1, alias="hasInsurance")
    food_permit: str = Field(..., min_length=1, alias="foodPermit")
    setup: str = Field(..., min_length=1, max_length=500)
    additional_comments: Optional[str] = Field(None, alias="additionalComments")
    
    class Config:
        populate_by_name = True

class VolunteerApplicationRequest(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=255, alias="firstName")
    last_name: str = Field(..., min_length=1, max_length=255, alias="lastName")
    email: EmailStr
    phone: str = Field(..., min_length=1, max_length=50)
    experience: Optional[str] = None
    skills: Optional[list] = None
    
    class Config:
        populate_by_name = True

class ArtistApplicationRequest(BaseModel):
    email: EmailStr
    full_legal_name: str = Field(..., min_length=1, max_length=255, alias="fullLegalName")
    dj_name: str = Field(..., min_length=1, max_length=255, alias="djName")
    city: str = Field(..., min_length=1, max_length=255)
    phone: str = Field(..., min_length=1, max_length=50)
    instagram_link: str = Field(..., min_length=1, max_length=500, alias="instagramLink")
    contact_method: str = Field(..., min_length=1, max_length=50, alias="contactMethod")
    artist_bio: str = Field(..., min_length=1, alias="artistBio")
    b2b_favorite: str = Field(..., min_length=1, alias="b2bFavorite")
    main_genre: str = Field(..., min_length=1, max_length=100, alias="mainGenre")
    sub_genre: str = Field(..., min_length=1, max_length=100, alias="subGenre")
    other_sub_genre: Optional[str] = Field(None, max_length=100, alias="otherSubGenre")
    other_genre_text: Optional[str] = Field(None, alias="otherGenreText")
    live_performance_links: str = Field(..., min_length=1, alias="livePerformanceLinks")
    soundcloud_link: str = Field(..., min_length=1, max_length=500, alias="soundcloudLink")
    spotify_link: str = Field(..., min_length=1, max_length=500, alias="spotifyLink")
    rekordbox_familiar: str = Field(..., min_length=1, max_length=10, alias="rekordboxFamiliar")
    promo_kit_links: str = Field(..., min_length=1, alias="promoKitLinks")
    additional_info: Optional[str] = Field(None, alias="additionalInfo")
    
    class Config:
        populate_by_name = True

class ContactFormRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    subject: str = Field(..., min_length=1, max_length=500)
    message: str = Field(..., min_length=1, max_length=5000)

class SponsorInquiryRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone: str = Field(..., min_length=1, max_length=50)
    company: str = Field(..., min_length=1, max_length=255)
    product_industry: str = Field(..., min_length=1, alias="productIndustry")
    
    class Config:
        populate_by_name = True

# API Endpoints

@router.post("/email-signup", status_code=status.HTTP_201_CREATED)
async def submit_email_signup(data: EmailSignupRequest):
    """
    Submit email signup from Let's Connect form
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO email_signups (name, email, phone, marketing_consent, source)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, created_at
        """, (
            data.name,
            data.email,
            data.phone,
            data.marketing_consent,
            data.source
        ))
        
        result = cursor.fetchone()
        conn.commit()
        
        # Also submit to Google Sheets (non-blocking)
        try:
            google_sheets_service.submit_email_signup({
                'name': data.name,
                'email': data.email,
                'phone': data.phone or '',
                'marketing_consent': data.marketing_consent
            })
        except Exception as e:
            print(f"Warning: Failed to sync email signup to Google Sheets: {str(e)}")
        
        return {
            "success": True,
            "message": "Thank you for signing up! We'll keep you updated on upcoming events.",
            "id": result[0],
            "created_at": result[1].isoformat()
        }
        
    except psycopg2.IntegrityError:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email is already registered."
        )
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit signup: {str(e)}"
        )
    finally:
        cursor.close()
        conn.close()


@router.post("/contact", status_code=status.HTTP_201_CREATED)
async def submit_contact_form(data: ContactFormRequest):
    """
    Submit contact form and send email notification
    """
    try:
        # Send email
        email_sent = email_service.send_contact_form_email(
            name=data.name,
            email=data.email,
            subject=data.subject,
            message=data.message
        )
        
        if not email_sent:
            # Email failed but we'll still return success to user
            print(f"Warning: Contact form email failed to send from {data.email}")
        
        return {
            "success": True,
            "message": "Message sent successfully! We'll get back to you soon.",
            "email_sent": email_sent
        }
    
    except Exception as e:
        print(f"❌ Error processing contact form: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send message: {str(e)}"
        )


@router.post("/vendor-application", status_code=status.HTTP_201_CREATED)
async def submit_vendor_application(data: VendorApplicationRequest):
    """
    Submit vendor application
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO vendor_applications (
                business_name, contact_name, email, phone, business_type,
                description, website_social, price_point, has_insurance, 
                food_permit, setup, additional_comments, status
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, created_at
        """, (
            data.business_name,
            data.contact_name,
            data.email,
            data.phone,
            data.business_type,
            data.description,
            data.website_social,
            data.price_point,
            data.has_insurance,
            data.food_permit,
            data.setup,
            data.additional_comments,
            'pending'
        ))
        
        result = cursor.fetchone()
        conn.commit()
        
        # Also submit to Google Sheets (non-blocking)
        try:
            google_sheets_service.submit_vendor_application({
                'business_name': data.business_name,
                'contact_name': data.contact_name,
                'email': data.email,
                'phone': data.phone,
                'business_type': data.business_type,
                'description': data.description,
                'website_social': data.website_social,
                'price_point': data.price_point,
                'has_insurance': data.has_insurance,
                'food_permit': data.food_permit,
                'setup': data.setup,
                'additional_comments': data.additional_comments or ''
            })
        except Exception as e:
            print(f"Warning: Failed to sync to Google Sheets: {str(e)}")
        
        return {
            "success": True,
            "message": "Thank you for your vendor application! We'll review it and get back to you soon.",
            "id": result[0],
            "created_at": result[1].isoformat()
        }
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit application: {str(e)}"
        )
    finally:
        cursor.close()
        conn.close()

@router.post("/volunteer-application", status_code=status.HTTP_201_CREATED)
async def submit_volunteer_application(data: VolunteerApplicationRequest):
    """
    Submit volunteer application
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Convert skills list to JSON string
        skills_json = json.dumps(data.skills) if data.skills else None
        
        cursor.execute("""
            INSERT INTO volunteer_applications (
                first_name, last_name, email, phone, experience, skills, status
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, created_at
        """, (
            data.first_name,
            data.last_name,
            data.email,
            data.phone,
            data.experience,
            skills_json,
            'pending'
        ))
        
        result = cursor.fetchone()
        conn.commit()
        
        # Also submit to Google Sheets (non-blocking)
        try:
            google_sheets_service.submit_volunteer_application({
                'first_name': data.first_name,
                'last_name': data.last_name,
                'email': data.email,
                'phone': data.phone,
                'experience': data.experience or '',
                'skills': ', '.join(data.skills) if data.skills else ''
            })
        except Exception as e:
            print(f"Warning: Failed to sync to Google Sheets: {str(e)}")
        
        return {
            "success": True,
            "message": "Thank you for volunteering! We'll be in touch with next steps.",
            "id": result[0],
            "created_at": result[1].isoformat()
        }
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit application: {str(e)}"
        )
    finally:
        cursor.close()
        conn.close()

@router.post("/artist-application", status_code=status.HTTP_201_CREATED)
async def submit_artist_application(data: ArtistApplicationRequest):
    """
    Submit artist/DJ application
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO artist_applications (
                email, full_legal_name, dj_name, city, phone, instagram_link, contact_method,
                artist_bio, b2b_favorite, main_genre, sub_genre, other_sub_genre, other_genre_text,
                live_performance_links, soundcloud_link, spotify_link, rekordbox_familiar,
                promo_kit_links, additional_info, status
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, created_at
        """, (
            data.email,
            data.full_legal_name,
            data.dj_name,
            data.city,
            data.phone,
            data.instagram_link,
            data.contact_method,
            data.artist_bio,
            data.b2b_favorite,
            data.main_genre,
            data.sub_genre,
            data.other_sub_genre,
            data.other_genre_text,
            data.live_performance_links,
            data.soundcloud_link,
            data.spotify_link,
            data.rekordbox_familiar,
            data.promo_kit_links,
            data.additional_info,
            'pending'
        ))
        
        result = cursor.fetchone()
        conn.commit()
        
        # Also submit to Google Sheets (non-blocking)
        try:
            google_sheets_service.submit_dj_application({
                'email': data.email,
                'full_legal_name': data.full_legal_name,
                'dj_name': data.dj_name,
                'city': data.city,
                'phone': data.phone,
                'instagram_link': data.instagram_link,
                'contact_method': data.contact_method,
                'artist_bio': data.artist_bio,
                'b2b_favorite': data.b2b_favorite,
                'main_genre': data.main_genre,
                'sub_genre': data.sub_genre,
                'other_sub_genre': data.other_sub_genre or '',
                'other_genre_text': data.other_genre_text or '',
                'live_performance_links': data.live_performance_links,
                'soundcloud_link': data.soundcloud_link,
                'spotify_link': data.spotify_link,
                'rekordbox_familiar': data.rekordbox_familiar,
                'promo_kit_links': data.promo_kit_links,
                'additional_info': data.additional_info or ''
            })
        except Exception as e:
            print(f"Warning: Failed to sync to Google Sheets: {str(e)}")
        
        return {
            "success": True,
            "message": "Thank you for your artist application! We'll review your submission and contact you soon.",
            "id": result[0],
            "created_at": result[1].isoformat()
        }
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit application: {str(e)}"
        )
    finally:
        cursor.close()
        conn.close()

@router.post("/sponsor-inquiry", status_code=status.HTTP_201_CREATED)
async def submit_sponsor_inquiry(data: SponsorInquiryRequest):
    """
    Submit sponsor inquiry form
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO sponsor_inquiries (
                name, email, phone, company, product_industry, status
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, created_at
        """, (
            data.name,
            data.email,
            data.phone,
            data.company,
            data.product_industry,
            'pending'
        ))
        
        result = cursor.fetchone()
        conn.commit()
        
        # Also submit to Google Sheets (non-blocking)
        try:
            google_sheets_service.submit_sponsor_inquiry({
                'name': data.name,
                'email': data.email,
                'phone': data.phone,
                'company': data.company,
                'product_industry': data.product_industry
            })
        except Exception as e:
            print(f"Warning: Failed to sync sponsor inquiry to Google Sheets: {str(e)}")
        
        # Send notification email to team
        try:
            email_service.send_sponsor_inquiry_notification(
                name=data.name,
                email=data.email,
                phone=data.phone,
                company=data.company,
                product_industry=data.product_industry
            )
        except Exception as e:
            print(f"Warning: Failed to send sponsor inquiry email notification: {str(e)}")
        
        return {
            "success": True,
            "message": "Thank you for your interest in sponsoring! A team member will reach out to you soon.",
            "id": result[0],
            "created_at": result[1].isoformat()
        }
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit sponsor inquiry: {str(e)}"
        )
    finally:
        cursor.close()
        conn.close()

@router.get("/health")
async def forms_health_check():
    """Health check for forms API"""
    return {
        "status": "healthy",
        "service": "forms_api",
        "endpoints": {
            "email_signup": "/api/forms/email-signup",
            "vendor_application": "/api/forms/vendor-application",
            "volunteer_application": "/api/forms/volunteer-application",
            "artist_application": "/api/forms/artist-application",
            "sponsor_inquiry": "/api/forms/sponsor-inquiry",
            "contact": "/api/forms/contact"
        }
    }

