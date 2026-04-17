
import os
from dotenv import load_dotenv
load_dotenv('/home/acer/vantageai1/backend/.env')
from supabase import create_client
db = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))
result = db.table('brands').select('*').execute()
print('✅ Supabase connected! Brands table has', len(result.data), 'rows')
