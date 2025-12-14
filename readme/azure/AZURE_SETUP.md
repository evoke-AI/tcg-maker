# Azure Blob Storage Setup Guide

This guide will help you set up Azure Blob Storage for file uploads in the assignment submission system.

## Prerequisites

1. An Azure account with an active subscription
2. Access to create Azure Storage accounts

## Step 1: Create Azure Storage Account

1. Go to the [Azure Portal](https://portal.azure.com)
2. Click "Create a resource"
3. Search for "Storage account" and select it
4. Click "Create"
5. Fill in the required information:
   - **Subscription**: Select your subscription
   - **Resource Group**: Create new or use existing
   - **Storage account name**: Choose a unique name (e.g., `yourappstorage`)
   - **Region**: Choose a region close to your users
   - **Performance**: Standard
   - **Redundancy**: LRS (Locally Redundant Storage) for development
6. Click "Review + create" then "Create"

## Step 2: Get Connection String

1. Navigate to your newly created storage account
2. In the left sidebar, click "Access keys" under "Security + networking"
3. Copy the "Connection string" from key1 or key2

## Step 3: Configure Environment Variables

Add these variables to your `.env.local` file:

```env
# Azure Blob Storage Configuration
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=yourstorageaccount;AccountKey=your_account_key;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=submissions
```

Replace the connection string with the one you copied from Azure Portal.

### Important: Environment Variable Architecture

The Azure Blob Storage implementation uses a **runtime-only environment variable pattern** to prevent build-time errors. This means:

- **Environment variables are NOT accessed at module level** (during import)
- **Environment variables are accessed only when functions are called** (at runtime)
- **Build process can complete successfully** even when Azure credentials are not available

This is implemented through:
- `server/app/services/azure-blob-storage.ts` - Service layer that wraps client creation
- `server/lib/azure-blob-storage.ts` - Library functions that use the service layer

**Key Benefits:**
- ✅ Build succeeds in CI/CD environments without Azure credentials
- ✅ Docker builds work without secrets
- ✅ Development setup is more flexible
- ✅ Environment variables are validated only when actually needed

## Step 4: Container Configuration

The application will automatically create the container named `submissions` when the first file is uploaded. The container will be configured with:

- **Public access level**: Blob (allows public read access to files)
- **Organization**: Files are stored as `assignments/{assignment-id}/{uuid}{file-extension}`

## File Organization Structure

```
submissions/
├── assignments/
│   ├── assignment-1/
│   │   ├── uuid1.jpg
│   │   ├── uuid2.pdf
│   │   └── uuid3.png
│   ├── assignment-2/
│   │   ├── uuid4.jpg
│   │   └── uuid5.pdf
│   └── ...
```

## Security Considerations

### For Development
- The current setup uses public blob access for simplicity
- Files are accessible via direct URL

### For Production
Consider implementing:
- SAS (Shared Access Signatures) for temporary, secure access
- Private containers with application-controlled access
- CDN integration for better performance
- Blob lifecycle management for cost optimization

## Implementation Architecture

### Service Layer Pattern
The Azure Blob Storage implementation follows a **service layer pattern** to ensure environment variables are only accessed at runtime:

```
server/app/services/azure-blob-storage.ts
├── createAzureBlobClient()           # Creates BlobServiceClient at runtime
├── getAzureStorageCredentials()      # Gets credentials for SAS operations
└── getAzureStorageContainerName()    # Gets container name with fallback

server/lib/azure-blob-storage.ts
├── getContainerClient()              # Optimized helper for basic operations
├── getContainerClientWithCredentials() # Optimized helper for SAS operations
├── uploadFileToBlob()               # Main upload function
├── deleteFileFromBlob()             # File deletion function
└── generateBlobSASUrl()             # Secure URL generation
```

### Performance Optimizations
- **Single Configuration Call**: Each function makes one optimized call to gather exactly what it needs
- **Parallel Execution**: `Promise.all()` runs all service calls concurrently
- **Minimal Data Fetching**: Functions only retrieve required data (e.g., most operations only need `containerClient`)

### Best Practices for New Functions
When adding new Azure Blob Storage functions:

1. **Never access environment variables at module level**
2. **Use the service layer functions** (`createAzureBlobClient`, etc.)
3. **Optimize for what you need**: 
   - Basic operations → use `getContainerClient()`
   - SAS operations → use `getContainerClientWithCredentials()`
4. **Follow the async pattern** - all service functions are async

## Supported File Types

- **Images**: JPEG, JPG, PNG, GIF, WebP
- **Documents**: PDF
- **Size Limit**: 10MB per file

## Troubleshooting

### Build-Time Issues
**Problem**: `AZURE_STORAGE_CONNECTION_STRING environment variable is required` error during build
**Solution**: This indicates environment variables are being accessed at module level. Follow the runtime-only pattern:

```typescript
// ❌ DON'T: Module-level access (causes build errors)
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const client = BlobServiceClient.fromConnectionString(connectionString);

// ✅ DO: Runtime access through service layer
import { createAzureBlobClient } from '@/app/services/azure-blob-storage';

export async function myFunction() {
  const client = await createAzureBlobClient(); // Only accessed when called
}
```

### Connection Issues
- Verify the connection string is correct
- Check that the storage account is in the same region
- Ensure the storage account key hasn't been regenerated

### Permission Issues
- Verify the storage account allows blob creation
- Check that the connection string has the correct access key

### File Upload Failures
- Check file size (must be under 10MB)
- Verify file type is supported
- Check Azure Storage account quotas

## Cost Optimization

For production use:
1. Enable blob lifecycle management to automatically delete old files
2. Use cool or archive tiers for infrequently accessed files
3. Monitor usage and costs in Azure Portal
4. Consider using Azure CDN for frequently accessed files

## Next Steps

Once configured, students will be able to:
1. Upload images and PDFs with their assignment submissions
2. Preview images before submitting
3. Remove files before submission
4. View uploaded files in submission history

Teachers will be able to:
1. View all submitted files in the assignment review interface
2. Download files for grading
3. See file metadata (original name, size, type) 