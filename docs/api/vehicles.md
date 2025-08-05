# Vehicle API Endpoints Documentation

## Overview
This document describes all available API endpoints for vehicle management in the Golf Car Maintenance System.

## Base URL
```
/api/vehicles
```

## Authentication
All endpoints require proper authentication. Include the authorization header in your requests.

---

## 1. Vehicle CRUD Operations

### 1.1 Get All Vehicles
**Endpoint:** `GET /api/vehicles`

**Description:** Retrieve all vehicles with optional filtering and pagination.

**Query Parameters:**
- `page` (number, optional): Page number for pagination (default: 1)
- `limit` (number, optional): Number of items per page (default: 10, max: 100)
- `golf_course_id` (string, optional): Filter by golf course ID
- `status` (string, optional): Filter by vehicle status
- `include_jobs` (boolean, optional): Include related jobs data

**Response:**
```json
{
  "success": true,
  "message": "Vehicles retrieved successfully",
  "data": [
    {
      "id": "vehicle_id",
      "vehicle_number": "GC001",
      "serial_number": "SN123456",
      "brand": "Club Car",
      "model": "Precedent",
      "year": 2023,
      "battery_serial": "BAT789",
      "status": "active",
      "golf_course_id": "course_id",
      "golf_course_name": "Pine Valley Golf Course",
      "transfer_date": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 50,
    "items_per_page": 10
  }
}
```

### 1.2 Create New Vehicle
**Endpoint:** `POST /api/vehicles`

**Description:** Create a new vehicle with automatic serial number validation and history logging.

**Request Body:**
```json
{
  "vehicle_number": "GC001",
  "serial_number": "SN123456",
  "brand": "Club Car",
  "model": "Precedent",
  "year": 2023,
  "battery_serial": "BAT789",
  "status": "active",
  "golf_course_id": "course_id",
  "golf_course_name": "Pine Valley Golf Course"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vehicle created successfully",
  "data": {
    "id": "new_vehicle_id",
    "vehicle_number": "GC001",
    "serial_number": "SN123456",
    // ... other vehicle fields
  }
}
```

### 1.3 Update Vehicle
**Endpoint:** `PUT /api/vehicles`

**Description:** Update an existing vehicle with validation and history logging.

**Request Body:**
```json
{
  "id": "vehicle_id",
  "vehicle_number": "GC001-UPDATED",
  "brand": "Club Car",
  "model": "Precedent i3",
  "year": 2024,
  "status": "maintenance"
}
```

### 1.4 Delete Vehicle
**Endpoint:** `DELETE /api/vehicles`

**Description:** Delete a vehicle after checking for related jobs.

**Request Body:**
```json
{
  "id": "vehicle_id"
}
```

---

## 2. Individual Vehicle Operations

### 2.1 Get Vehicle by ID
**Endpoint:** `GET /api/vehicles/[id]`

**Description:** Retrieve detailed information about a specific vehicle.

**Query Parameters:**
- `include_jobs` (boolean, optional): Include related jobs
- `include_history` (boolean, optional): Include serial history
- `include_parts` (boolean, optional): Include parts usage

**Response:**
```json
{
  "success": true,
  "message": "Vehicle retrieved successfully",
  "data": {
    "id": "vehicle_id",
    "vehicle_number": "GC001",
    // ... vehicle fields
    "golf_course": {
      "id": "course_id",
      "name": "Pine Valley Golf Course"
    },
    "jobs": [
      {
        "id": "job_id",
        "type": "maintenance",
        "status": "completed",
        "createdAt": "2024-01-10T00:00:00Z"
      }
    ],
    "serial_history": [
      {
        "id": "history_id",
        "action_type": "create",
        "action_date": "2024-01-01T00:00:00Z",
        "golf_course_name": "Pine Valley Golf Course"
      }
    ]
  }
}
```

### 2.2 Update Vehicle by ID
**Endpoint:** `PUT /api/vehicles/[id]`

**Description:** Update a specific vehicle with validation.

### 2.3 Update Vehicle Status
**Endpoint:** `PATCH /api/vehicles/[id]`

**Description:** Update only the status of a vehicle.

**Request Body:**
```json
{
  "status": "maintenance",
  "reason": "Scheduled maintenance"
}
```

### 2.4 Delete Vehicle by ID
**Endpoint:** `DELETE /api/vehicles/[id]`

**Description:** Delete a specific vehicle.

---

## 3. Vehicle Transfer Operations

### 3.1 Transfer Vehicles
**Endpoint:** `POST /api/vehicles/transfer`

**Description:** Transfer multiple vehicles between golf courses.

**Request Body:**
```json
{
  "vehicle_ids": ["vehicle_id_1", "vehicle_id_2"],
  "target_golf_course_id": "new_course_id",
  "target_golf_course_name": "New Golf Course",
  "transfer_reason": "Seasonal relocation",
  "transfer_date": "2024-02-01T00:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vehicles transferred successfully",
  "data": {
    "transferred_count": 2,
    "failed_transfers": [],
    "transfer_details": [
      {
        "vehicle_id": "vehicle_id_1",
        "from_course": "Old Course",
        "to_course": "New Course",
        "transfer_date": "2024-02-01T00:00:00Z"
      }
    ]
  }
}
```

### 3.2 Get Transfer History
**Endpoint:** `GET /api/vehicles/transfer`

**Description:** Retrieve transfer history with filtering options.

**Query Parameters:**
- `vehicle_id` (string, optional): Filter by vehicle ID
- `golf_course_id` (string, optional): Filter by golf course ID
- `date_from` (string, optional): Start date filter (ISO format)
- `date_to` (string, optional): End date filter (ISO format)
- `page` (number, optional): Page number
- `limit` (number, optional): Items per page

---

## 4. Bulk Operations

### 4.1 Bulk Vehicle Operations
**Endpoint:** `POST /api/vehicles/bulk`

**Description:** Perform bulk operations on multiple vehicles.

**Request Body:**
```json
{
  "action": "update_status",
  "vehicle_ids": ["id1", "id2", "id3"],
  "data": {
    "status": "maintenance",
    "reason": "Scheduled maintenance"
  }
}
```

**Supported Actions:**
- `create`: Create multiple vehicles
- `update_status`: Update status of multiple vehicles
- `delete`: Delete multiple vehicles
- `transfer`: Transfer multiple vehicles

**Response:**
```json
{
  "success": true,
  "message": "Bulk operation completed",
  "data": {
    "total_processed": 3,
    "successful": 2,
    "failed": 1,
    "results": [
      {
        "vehicle_id": "id1",
        "success": true,
        "message": "Status updated successfully"
      },
      {
        "vehicle_id": "id2",
        "success": false,
        "error": "Vehicle has pending jobs"
      }
    ]
  }
}
```

---

## 5. Search and Filter Operations

### 5.1 Basic Search
**Endpoint:** `GET /api/vehicles/search`

**Description:** Search and filter vehicles with various criteria.

**Query Parameters:**
- `search` (string): Text search across multiple fields
- `golf_course_id` (string): Filter by golf course
- `status` (string): Filter by status
- `brand` (string): Filter by brand
- `model` (string): Filter by model
- `year` (number): Filter by year
- `vehicle_number` (string): Filter by vehicle number
- `serial_number` (string): Filter by serial number
- `battery_serial` (string): Filter by battery serial
- `page` (number): Page number
- `limit` (number): Items per page
- `sort_by` (string): Sort field
- `sort_order` (string): Sort order (asc/desc)

### 5.2 Advanced Search
**Endpoint:** `POST /api/vehicles/search`

**Description:** Advanced search with complex filters.

**Request Body:**
```json
{
  "filters": {
    "golf_course_ids": ["course1", "course2"],
    "statuses": ["active", "maintenance"],
    "year_from": 2020,
    "year_to": 2024,
    "has_jobs": true,
    "has_pending_jobs": false,
    "recently_transferred_days": 30,
    "text_search": "Club Car"
  },
  "pagination": {
    "page": 1,
    "limit": 20
  },
  "sorting": {
    "field": "createdAt",
    "order": "desc"
  },
  "include_stats": true
}
```

---

## 6. Statistics and Analytics

### 6.1 Get Vehicle Statistics
**Endpoint:** `GET /api/vehicles/stats`

**Description:** Retrieve comprehensive vehicle statistics and analytics.

**Query Parameters:**
- `golf_course_id` (string, optional): Filter by golf course
- `date_from` (string, optional): Start date for analysis
- `date_to` (string, optional): End date for analysis
- `include_details` (boolean, optional): Include detailed breakdowns

**Response:**
```json
{
  "success": true,
  "message": "Vehicle statistics retrieved successfully",
  "data": {
    "summary": {
      "total_vehicles": 150,
      "vehicles_with_jobs": 120,
      "vehicles_with_pending_jobs": 25,
      "recent_transfers_30_days": 8,
      "vehicles_without_jobs": 30
    },
    "by_status": [
      {
        "status": "active",
        "count": 100,
        "percentage": 67
      },
      {
        "status": "maintenance",
        "count": 30,
        "percentage": 20
      }
    ],
    "by_golf_course": [
      {
        "golf_course_name": "Pine Valley",
        "count": 50,
        "percentage": 33
      }
    ],
    "by_brand": [
      {
        "brand": "Club Car",
        "count": 80,
        "percentage": 53
      }
    ],
    "by_year": [
      {
        "year": 2023,
        "count": 40,
        "percentage": 27
      }
    ],
    "maintenance_stats": [
      {
        "job_type": "maintenance",
        "job_status": "completed",
        "count": 45
      }
    ],
    "top_parts_used": [
      {
        "part_name": "Battery",
        "total_quantity_used": 25,
        "usage_count": 15
      }
    ]
  }
}
```

### 6.2 Generate Custom Reports
**Endpoint:** `POST /api/vehicles/stats`

**Description:** Generate custom statistical reports with specific parameters.

**Request Body:**
```json
{
  "report_type": "detailed",
  "filters": {
    "golf_course_ids": ["course1"],
    "statuses": ["active", "maintenance"],
    "brands": ["Club Car", "EZ-GO"]
  },
  "date_range": {
    "from": "2024-01-01",
    "to": "2024-12-31"
  },
  "group_by": ["status", "golf_course", "brand", "year"],
  "metrics": ["count", "percentage", "trends"]
}
```

**Report Types:**
- `summary`: Basic overview statistics
- `detailed`: Comprehensive analysis
- `maintenance`: Maintenance-focused report
- `transfer`: Transfer activity report
- `custom`: Fully customizable report

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message",
  "code": "ERROR_CODE"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict (e.g., duplicate serial number)
- `422`: Validation Error
- `500`: Internal Server Error

---

## Data Models

### Vehicle Model
```typescript
interface Vehicle {
  id: string;
  vehicle_number: string;
  serial_number: string;
  brand?: string;
  model?: string;
  year?: number;
  battery_serial?: string;
  status: 'active' | 'maintenance' | 'retired' | 'parked' | 'spare' | 'inactive';
  golf_course_id?: string;
  golf_course_name?: string;
  transfer_date?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Serial History Entry
```typescript
interface SerialHistoryEntry {
  id: string;
  vehicle_id: string;
  action_type: 'create' | 'update' | 'delete' | 'transfer' | 'status_change';
  action_date: Date;
  golf_course_name?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  reason?: string;
  performed_by?: string;
}
```

---

## Rate Limiting

API endpoints are subject to rate limiting:
- **Standard endpoints**: 100 requests per minute
- **Bulk operations**: 10 requests per minute
- **Statistics endpoints**: 20 requests per minute

---

## Best Practices

1. **Pagination**: Always use pagination for large datasets
2. **Filtering**: Use specific filters to reduce response size
3. **Caching**: Cache frequently accessed data on the client side
4. **Error Handling**: Implement proper error handling for all API calls
5. **Validation**: Validate data on the client side before sending requests
6. **Serial Numbers**: Ensure serial numbers are unique across the system
7. **Status Changes**: Always provide a reason for status changes
8. **Bulk Operations**: Use bulk endpoints for multiple operations to improve performance

---

## Examples

### Example 1: Create a New Vehicle
```javascript
const response = await fetch('/api/vehicles', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token'
  },
  body: JSON.stringify({
    vehicle_number: 'GC001',
    serial_number: 'SN123456',
    brand: 'Club Car',
    model: 'Precedent',
    year: 2023,
    status: 'active',
    golf_course_id: 'course-123',
    golf_course_name: 'Pine Valley Golf Course'
  })
});

const result = await response.json();
```

### Example 2: Search Vehicles
```javascript
const searchParams = new URLSearchParams({
  search: 'Club Car',
  status: 'active',
  golf_course_id: 'course-123',
  page: '1',
  limit: '20'
});

const response = await fetch(`/api/vehicles/search?${searchParams}`);
const result = await response.json();
```

### Example 3: Transfer Vehicles
```javascript
const response = await fetch('/api/vehicles/transfer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token'
  },
  body: JSON.stringify({
    vehicle_ids: ['vehicle-1', 'vehicle-2'],
    target_golf_course_id: 'new-course-456',
    target_golf_course_name: 'Ocean View Golf Course',
    transfer_reason: 'Seasonal relocation'
  })
});

const result = await response.json();
```

---

## Support

For API support and questions, please contact the development team or refer to the main system documentation.