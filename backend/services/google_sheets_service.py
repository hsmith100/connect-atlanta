"""
Google Sheets Service
Handles integration with Google Sheets for form submissions
"""

import gspread
from google.oauth2.service_account import Credentials
from datetime import datetime
from typing import Dict, Optional
import json
import os
from decouple import config

class GoogleSheetsService:
    """Service for managing Google Sheets submissions"""
    
    # Google Sheets URLs from client feedback
    VENDOR_SHEET_ID = "1SUbvzglTqd6iFmAe69XRB__0APhSKfRUHl1zpHUGs-A"
    VOLUNTEER_SHEET_ID = "1-V9HV0AJWqdz0yqIrNQuC2quzGGBFGsRGW5hjfbqZCA"
    DJ_SHEET_ID = "1EF3DzG4OjayDjsZtWNezsPh6EwDKKMJWKIAr67LtGls"
    EMAIL_SHEET_ID = "12gfqB3p103wo8vSzl1WUNys4dmbi8hV8nan6ND7LH8I"
    # Sponsor inquiry sheet - will be set from environment variable
    SPONSOR_SHEET_ID = None  # Must be configured via SPONSOR_INQUIRY_SHEET_ID env var
    
    def __init__(self):
        """Initialize Google Sheets client with service account credentials"""
        self.client = None
        self.credentials_path = config("GOOGLE_CREDENTIALS_PATH", default=None)
        self.credentials_json = config("GOOGLE_CREDENTIALS_JSON", default=None)
        # Get sponsor sheet ID from environment variable
        if not self.SPONSOR_SHEET_ID:
            self.__class__.SPONSOR_SHEET_ID = os.getenv('SPONSOR_INQUIRY_SHEET_ID')
        
    def _get_client(self):
        """Get or create Google Sheets client"""
        if self.client:
            return self.client
            
        try:
            # Define the scope
            scopes = [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive'
            ]
            
            # Try to load credentials from JSON string (for environment variables)
            if self.credentials_json:
                credentials_dict = json.loads(self.credentials_json)
                credentials = Credentials.from_service_account_info(
                    credentials_dict,
                    scopes=scopes
                )
            # Or from file path
            elif self.credentials_path and os.path.exists(self.credentials_path):
                credentials = Credentials.from_service_account_file(
                    self.credentials_path,
                    scopes=scopes
                )
            else:
                print("Warning: No Google Sheets credentials configured. Skipping Google Sheets sync.")
                return None
                
            self.client = gspread.authorize(credentials)
            return self.client
            
        except Exception as e:
            print(f"Error initializing Google Sheets client: {str(e)}")
            return None
    
    def _append_row_to_sheet(self, sheet_id: str, row_data: list) -> bool:
        """
        Append a row to a Google Sheet
        
        Args:
            sheet_id: The Google Sheets ID
            row_data: List of values to append
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            client = self._get_client()
            if not client:
                return False
                
            # Open the spreadsheet by ID
            spreadsheet = client.open_by_key(sheet_id)
            
            # Get the first worksheet
            worksheet = spreadsheet.sheet1
            
            # Debug: Log what we're about to append
            print(f"✅ Appending to Google Sheets (ID: {sheet_id[:10]}...): {row_data[0]} (timestamp)")
            
            # Find the next empty row
            next_row = len(worksheet.get_all_values()) + 1
            print(f"📊 Current row count: {next_row - 1}, inserting at row: {next_row}")
            
            # Insert the row at the next position
            worksheet.insert_row(row_data, next_row, value_input_option='USER_ENTERED')
            
            print(f"✅ Successfully inserted row at position {next_row}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error appending to Google Sheets: {str(e)}")
            return False
    
    def submit_vendor_application(self, data: Dict) -> bool:
        """
        Submit vendor application to Google Sheets
        
        Sheet columns: A=Timestamp, B-K=Alumni/C/S/E/I/AFRD/P/T1/T2/R (not used), 
        L=Store Name, M=Owner's Full Name, N=What kind of business, O=Description, 
        P=Website/Social, Q=Price Point, R=Has insurance, S=Is registered entity, 
        T=Email, U=Phone, V=Additional Comments, W=Brief description, X=Food permit, 
        Y=Setup, Z=(empty), AA=Permits to sell
        """
        row_data = [
            datetime.now().strftime("%m/%d/%Y %H:%M:%S"),  # Column A - Timestamp
            '', '', '', '', '', '', '', '', '', '',        # Columns B-K (Alumni, C, S, E, I, AFRD, P, T1, T2, R - not used)
            data.get('business_name', ''),   # Column L - Store Name
            data.get('contact_name', ''),    # Column M - Owner's Full Name
            data.get('business_type', ''),   # Column N - What kind of business are you?
            data.get('description', ''),     # Column O - Description of what you're selling
            data.get('website_social', ''),  # Column P - Website or Social Media Links
            data.get('price_point', ''),     # Column Q - Average Price Point
            data.get('has_insurance', ''),   # Column R - Does your business have insurance?
            '',                              # Column S - Is this business a registered entity? (not collected)
            data.get('email', ''),           # Column T - Email
            data.get('phone', ''),           # Column U - Phone Number
            data.get('additional_comments', ''),  # Column V - Additional Comments
            '',                              # Column W - Brief description of your business (not collected)
            data.get('food_permit', ''),     # Column X - If selling food or beverages, do you have a food service permit?
            data.get('setup', ''),           # Column Y - What is your setup?
            '',                              # Column Z - (empty)
            ''                               # Column AA - Do you have Permits to sell? (not collected)
        ]
        
        return self._append_row_to_sheet(self.VENDOR_SHEET_ID, row_data)
    
    def submit_volunteer_application(self, data: Dict) -> bool:
        """
        Submit volunteer application to Google Sheets
        
        Expected columns: Timestamp, First Name, Last Name, Email, Phone, Experience, Skills
        """
        row_data = [
            datetime.now().strftime("%m/%d/%Y %H:%M:%S"),
            data.get('first_name', ''),
            data.get('last_name', ''),
            data.get('email', ''),
            data.get('phone', ''),
            data.get('experience', ''),
            data.get('skills', '')
        ]
        
        return self._append_row_to_sheet(self.VOLUNTEER_SHEET_ID, row_data)
    
    def submit_dj_application(self, data: Dict) -> bool:
        """
        Submit DJ/Artist application to Google Sheets
        
        Sheet columns: A=Timestamp, B=RATING (internal), C=DJ Name, D=Email, E=Main Genre, 
        F=Other Genres, G=Artist Bio, H=B2B Favorite, I=Spotify Link, J=Email (duplicate), 
        K=Instagram Link, L=Phone, M=Rekordbox Familiar, N=Contact Method, O=Promo Kits, 
        P=EPKs upload, Q=Additional Info, R=City, S=Sub Genre, T=Other Sub Genre, 
        U=Live Performance Links, V=Soundcloud Link, W=Other Genre Text, X=Full legal name, 
        Y=Column 20, Z=Upload Any Lo
        """
        row_data = [
            datetime.now().strftime("%m/%d/%Y %H:%M:%S"),  # A - Timestamp
            '',                                             # B - RATING (internal field - not collected)
            data.get('dj_name', ''),                       # C - DJ Name / Alias
            data.get('email', ''),                         # D - Email Address
            data.get('main_genre', ''),                    # E - Main Genre
            '',                                             # F - What Other Genres (not collected separately)
            data.get('artist_bio', ''),                    # G - Tell us about you
            data.get('b2b_favorite', ''),                  # H - Favorite DJ to B2B with
            data.get('spotify_link', ''),                  # I - Spotify Link
            data.get('email', ''),                         # J - Email (duplicate)
            data.get('instagram_link', ''),                # K - Instagram Link
            data.get('phone', ''),                         # L - Phone number
            data.get('rekordbox_familiar', ''),            # M - Rekordbox Familiar
            data.get('contact_method', ''),                # N - Best way to contact
            data.get('promo_kit_links', ''),               # O - Promo and Press Kits
            '',                                             # P - Upload EPKs (not collected)
            data.get('additional_info', ''),               # Q - Anything else
            data.get('city', ''),                          # R - City Located
            data.get('sub_genre', ''),                     # S - Sub Genre
            data.get('other_sub_genre', ''),               # T - Other Sub Genre
            data.get('live_performance_links', ''),        # U - Links to live performances
            data.get('soundcloud_link', ''),               # V - Soundcloud Mix Link
            data.get('other_genre_text', ''),              # W - Other Genre Selections
            data.get('full_legal_name', ''),               # X - Full legal name
            '',                                             # Y - Column 20 (not used)
            ''                                              # Z - Upload Any Lo (not used)
        ]
        
        return self._append_row_to_sheet(self.DJ_SHEET_ID, row_data)
    
    def submit_sponsor_inquiry(self, data: Dict) -> bool:
        """
        Submit sponsor inquiry to Google Sheets
        
        Expected columns: Timestamp, Name, Email, Phone Number, Company, Tell us about your Product/Industry
        """
        row_data = [
            datetime.now().strftime("%m/%d/%Y %H:%M:%S"),  # Timestamp
            data.get('name', ''),                          # Name
            data.get('email', ''),                         # Email
            data.get('phone', ''),                         # Phone Number
            data.get('company', ''),                       # Company
            data.get('product_industry', '')               # Tell us about your Product/Industry
        ]
        
        if self.SPONSOR_SHEET_ID:
            return self._append_row_to_sheet(self.SPONSOR_SHEET_ID, row_data)
        else:
            print("Warning: SPONSOR_INQUIRY_SHEET_ID not configured in environment variables")
            return False
    
    def submit_email_signup(self, data: Dict) -> bool:
        """
        Submit email signup to Google Sheets
        
        Expected columns: Timestamp, First Name, Last Name, Email, Phone Number, 
                         I agree to receive marketing communications...
        """
        # Split name into first and last name
        name_parts = data.get('name', '').strip().split(' ', 1)
        first_name = name_parts[0] if len(name_parts) > 0 else ''
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        row_data = [
            datetime.now().strftime("%m/%d/%Y %H:%M:%S"),  # Timestamp
            first_name,                                     # First Name
            last_name,                                      # Last Name
            data.get('email', ''),                         # Email
            data.get('phone', ''),                         # Phone Number
            'Yes' if data.get('marketing_consent', False) else 'No'  # Marketing consent
        ]
        
        return self._append_row_to_sheet(self.EMAIL_SHEET_ID, row_data)


# Create a singleton instance
google_sheets_service = GoogleSheetsService()
