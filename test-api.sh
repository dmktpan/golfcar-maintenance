#!/bin/bash

# API Testing Script for Golf Car Maintenance System
# ใช้สำหรับทดสอบ API endpoints ทั้งหมด

BASE_URL="http://localhost:3000/api"

echo "🚀 Testing Golf Car Maintenance API Endpoints"
echo "=============================================="

# Test 1: Clear existing data
echo "1. Clearing existing data..."
curl -X POST "$BASE_URL/clear-data" \
  -H "Content-Type: application/json" \
  | jq '.'

echo -e "\n"

# Test 2: Seed initial data
echo "2. Seeding initial data..."
curl -X POST "$BASE_URL/seed-initial-data" \
  -H "Content-Type: application/json" \
  | jq '.'

echo -e "\n"

# Test 3: Get all golf courses
echo "3. Getting all golf courses..."
curl -X GET "$BASE_URL/golf-courses" \
  -H "Content-Type: application/json" \
  | jq '.'

echo -e "\n"

# Test 4: Create a new golf course
echo "4. Creating a new golf course..."
curl -X POST "$BASE_URL/golf-courses" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ทดสอบสนามใหม่"
  }' \
  | jq '.'

echo -e "\n"

# Test 5: Get all users
echo "5. Getting all users..."
curl -X GET "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  | jq '.'

echo -e "\n"

# Test 6: Create a new user
echo "6. Creating a new user..."
curl -X POST "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "test001",
    "name": "ผู้ใช้ทดสอบ",
    "role": "staff",
    "golf_course_id": 1,
    "managed_golf_courses": []
  }' \
  | jq '.'

echo -e "\n"

# Test 7: Get all vehicles
echo "7. Getting all vehicles..."
curl -X GET "$BASE_URL/vehicles" \
  -H "Content-Type: application/json" \
  | jq '.'

echo -e "\n"

# Test 8: Create a new vehicle
echo "8. Creating a new vehicle..."
curl -X POST "$BASE_URL/vehicles" \
  -H "Content-Type: application/json" \
  -d '{
    "serial_number": "TEST-2024-001",
    "vehicle_number": "T01",
    "golf_course_id": 1,
    "golf_course_name": "วอเตอร์แลนด์",
    "model": "Test Model",
    "battery_serial": "BAT-TEST-001",
    "status": "active"
  }' \
  | jq '.'

echo -e "\n"

# Test 9: Get all parts
echo "9. Getting all parts..."
curl -X GET "$BASE_URL/parts" \
  -H "Content-Type: application/json" \
  | jq '.'

echo -e "\n"

# Test 10: Create a new part
echo "10. Creating a new part..."
curl -X POST "$BASE_URL/parts" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "อะไหล่ทดสอบ",
    "unit": "ชิ้น",
    "stock_qty": 10,
    "min_qty": 2,
    "max_qty": 20
  }' \
  | jq '.'

echo -e "\n"

# Test 11: Get all jobs
echo "11. Getting all jobs..."
curl -X GET "$BASE_URL/jobs" \
  -H "Content-Type: application/json" \
  | jq '.'

echo -e "\n"

# Test 12: Create a new job
echo "12. Creating a new job..."
curl -X POST "$BASE_URL/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "PM",
    "status": "pending",
    "vehicle_id": 101,
    "vehicle_number": "A01",
    "golf_course_id": 1,
    "user_id": 1,
    "userName": "tape1408",
    "system": "brake",
    "subTasks": ["ตรวจสอบระบบเบรค"],
    "parts": [],
    "partsNotes": "",
    "remarks": "งานทดสอบ API"
  }' \
  | jq '.'

echo -e "\n"

# Test 13: Get maintenance data
echo "13. Getting maintenance data..."
curl -X GET "$BASE_URL/maintenance" \
  -H "Content-Type: application/json" \
  | jq '.'

echo -e "\n"

# Test 14: Test Prisma connection
echo "14. Testing Prisma connection..."
curl -X GET "$BASE_URL/test-prisma/crud" \
  -H "Content-Type: application/json" \
  | jq '.'

echo -e "\n"

echo "✅ API Testing Complete!"
echo "========================"