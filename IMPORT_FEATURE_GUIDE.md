# LifeLedger Import Feature Guide

## Overview
The Import Page allows users to add transaction data in three ways:
1. **CSV Upload** - Upload and preview CSV files before importing
2. **PDF Text Extract** - Extract text from PDF files for manual processing  
3. **Manual Entry** - Add individual transactions through a form

## How It Works (Beginner Explanation)

### 1. CSV Upload
- **What it does**: Reads a CSV file, shows you a preview, then saves all transactions
- **How it works**: 
  - User selects a CSV file
  - JavaScript reads the file and splits it into rows and columns
  - Shows first 5 rows as a preview table
  - When user clicks "Import", sends all data to your Java backend
- **Expected CSV format**:
  ```
  date,merchant,amount,notes
  2024-01-15,Grocery Store,-45.50,Weekly shopping
  2024-01-14,Salary,2500.00,Monthly salary
  ```

### 2. PDF Text Extraction
- **What it does**: Extracts readable text from PDF files
- **How it works**:
  - User uploads a PDF file
  - JavaScript reads the file and tries to extract text (basic method)
  - Shows extracted text in a preview box
  - User manually copies relevant data to Manual Entry tab
- **Note**: This is a basic extraction. For production, consider using a Java PDF library

### 3. Manual Entry
- **What it does**: Simple form to add one transaction at a time
- **How it works**:
  - User fills out form fields (date, merchant, amount, etc.)
  - Form validates required fields
  - Sends single transaction to your Java backend
  - Form resets after successful submission

## Authentication Integration

The page uses your existing authentication system:
- Gets user info from `useAuth()` hook
- Automatically includes JWT token in API calls via `apiService`
- Token is loaded from `localStorage` so it works after page refresh

## Frontend Code Structure (`ImportPage.jsx`)

- **State Management**: Uses React `useState` for file uploads, previews, and form data
- **File Reading**: Uses `FileReader` API to read CSV and PDF files
- **API Calls**: Uses your existing `apiService` with automatic token handling
- **Styling**: Matches your existing Tailwind CSS patterns

## Required Java Backend Endpoints

You need to add these endpoints to your existing Java backend:

### POST `/api/import/csv`
```json
// Request body:
{
  "userId": "user123",
  "transactions": [
    {
      "date": "2024-01-15",
      "merchant": "Store Name",
      "amount": "-45.50",
      "notes": "Purchase description"
    }
  ]
}

// Expected Response:
{
  "success": true,
  "message": "Successfully imported 25 transactions",
  "imported": 25,
  "skipped": 2
}
```

### POST `/api/import/manual`
```json
// Request body:
{
  "userId": "user123",
  "transaction": {
    "date": "2024-01-15",
    "merchant": "Store Name",
    "amount": -45.50,
    "notes": "Purchase description"
  }
}

// Expected Response:
{
  "success": true,
  "message": "Transaction added successfully",
  "transaction": { /* saved transaction data */ }
}
```

## Java Backend Requirements

1. **Authentication**: Verify JWT token from Authorization header
2. **Data Validation**: Validate required fields (date, amount)
3. **User Isolation**: Ensure transactions are saved for the correct user
4. **Error Handling**: Return proper HTTP status codes and error messages
5. **Database Integration**: Save transactions to your existing database

## Security Features

- **JWT Authentication**: All endpoints require valid JWT token
- **User Isolation**: Transactions are tied to specific user IDs
- **Input Validation**: Frontend and backend validate all data
- **File Type Restrictions**: Only CSV and PDF files accepted

## Error Handling

- **Frontend**: Shows user-friendly error messages
- **Backend**: Should return proper HTTP status codes and error messages
- **Validation**: Checks required fields before processing
- **Fallbacks**: Graceful handling of invalid file formats

## Testing the Feature

1. **CSV Test**: Create a simple CSV file with the expected format
2. **Manual Entry Test**: Add a transaction through the form
3. **PDF Test**: Upload a PDF and check text extraction
4. **Authentication Test**: Refresh page and verify token still works

## Next Steps

1. **Add Java endpoints**: Implement the two required endpoints in your backend
2. **Test integration**: Verify the frontend can communicate with your Java backend
3. **Enhance PDF extraction**: Consider using Java PDF libraries for better text extraction
4. **Add validation**: Implement server-side validation in your Java endpoints

The React frontend is ready to use with your existing Java backend once you add the required endpoints!