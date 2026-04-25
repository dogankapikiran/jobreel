import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(
  'https://kppwccarzjktqxfnehqb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwcHdjY2FyemprdHF4Zm5laHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NTA5MzcsImV4cCI6MjA5MjQyNjkzN30.S7hg08DvEIQBYPxbf3ZneUht_OKM0HX-42r4uh0Zk1w',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
