#!/bin/bash
# Verify environment variables are configured

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "❌ Error: Supabase environment variables are not configured"
  echo ""
  echo "Please set:"
  echo "  NEXT_PUBLIC_SUPABASE_URL"
  echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY"
  echo ""
  echo "Get these from: https://supabase.com → Project Settings → API"
  exit 1
fi

echo "✅ Environment variables are configured"
