# Azure Blob Storage Functions

## Purpose
Provides a comprehensive set of functions for Azure Blob Storage operations including file uploads, deletions, and secure URL generation. Implements a runtime-only environment variable pattern to prevent build-time errors and optimize performance through efficient service layer calls.

## Usage

### Basic File Upload
```typescript
import { uploadFileToBlob } from '@/lib/azure-blob-storage';

const result = await uploadFileToBlob(fileBuffer, {
  originalName: 'document.pdf',
  contentType: 'application/pdf',
  size: 1024000,
  assignmentId: 'assignment-123',
  studentId: 'student-456'
});

if (result.success) {
  console.log('File uploaded:', result.blobUrl);
} else {
  console.error('Upload failed:', result.error);
}
```

### File Deletion
```typescript
import { deleteFileFromBlob } from '@/lib/azure-blob-storage';

const success = await deleteFileFromBlob('assignments/assignment-123/uuid.pdf');
```

### Secure URL Generation
```typescript
import { generateBlobSASUrl } from '@/lib/azure-blob-storage';

// Generate URL valid for 24 hours
const secureUrl = await generateBlobSASUrl('assignments/assignment-123/uuid.pdf', 24 * 60);
```

### File Validation
```typescript
import { isValidFileType, isValidFileSize } from '@/lib/azure-blob-storage';

if (!isValidFileType(file.type)) {
  throw new Error('Invalid file type');
}

if (!isValidFileSize(file.size)) {
  throw new Error('File too large');
}
```

## Design & Implementation Notes

### Runtime-Only Environment Variable Pattern
**Problem Solved**: Build-time errors when Azure environment variables are not available during Docker builds or CI/CD pipelines.

**Solution**: Environment variables are accessed only at runtime through a service layer:
- `server/app/services/azure-blob-storage.ts` - Service functions that access env vars
- `server/lib/azure-blob-storage.ts` - Library functions that use the service layer

### Performance Optimizations
**Challenge**: Original implementation made multiple separate calls to service functions, causing inefficient environment variable reads and client initializations.

**Solution**: Implemented optimized helper functions:
- `getContainerClient()` - For basic operations (upload, delete)
- `getContainerClientWithCredentials()` - For SAS operations requiring credentials
- Uses `Promise.all()` for parallel execution of service calls

### Architecture Decision: Service Layer Pattern
```
Service Layer (server/app/services/azure-blob-storage.ts)
├── createAzureBlobClient()           # Client creation with connection string
├── getAzureStorageCredentials()      # Credentials extraction and validation
└── getAzureStorageContainerName()    # Container name with fallback

Library Layer (server/lib/azure-blob-storage.ts)
├── getContainerClient()              # Optimized for basic operations
├── getContainerClientWithCredentials() # Optimized for SAS operations
├── uploadFileToBlob()               # Main upload function
├── deleteFileFromBlob()             # File deletion function
└── generateBlobSASUrl()             # Secure URL generation
```

### File Organization Strategy
Files are organized as: `assignments/{assignment-id}/{uuid}{file-extension}`
- Prevents naming conflicts with UUID generation
- Maintains logical grouping by assignment
- Preserves original file extensions for proper MIME type handling

## Dependencies

### Required Packages
- `@azure/storage-blob` - Azure Blob Storage SDK
- `uuid` - UUID generation for unique file names

### Environment Variables
- `AZURE_STORAGE_CONNECTION_STRING` - Azure storage account connection string
- `AZURE_STORAGE_CONTAINER_NAME` - Container name (defaults to 'submissions')

### Internal Dependencies
- `@/app/services/azure-blob-storage` - Service layer functions
- Must be used in server-side code only (API routes, server actions)

## Testing & Validation

### File Type Validation
Supports: JPEG, JPG, PNG, GIF, WebP, PDF
- Validates against MIME type, not file extension
- Case-insensitive validation

### File Size Validation
- Maximum size: 10MB (10,485,760 bytes)
- Validates actual file size, not declared size

### Error Handling
- All functions return structured error responses
- Errors are logged but not thrown (except for environment variable issues)
- Graceful fallbacks (e.g., direct URL if SAS generation fails)

### Build-Time Validation
- Functions can be imported and built without Azure credentials
- Environment variables are validated only when functions are called
- Prevents CI/CD pipeline failures due to missing secrets

## Security Considerations

### Development vs Production
- **Development**: Uses direct blob URLs for simplicity
- **Production**: Generates SAS URLs for secure, time-limited access

### SAS URL Generation
- Read-only permissions by default
- Configurable expiration time (default: 60 minutes)
- Includes start time to prevent premature access

### File Access Control
- Container-level access control
- SAS tokens provide granular, time-limited access
- No public write access to prevent abuse

## Performance Characteristics

### Optimized Service Calls
- **Before**: 3 separate service calls per operation
- **After**: 1 optimized call gathering exactly what's needed
- **Improvement**: ~3x reduction in environment variable reads

### Parallel Execution
- All service dependencies resolved concurrently with `Promise.all()`
- Reduces total execution time for operations requiring multiple dependencies

### Memory Efficiency
- Streams file uploads rather than loading entire files into memory
- Minimal object creation and reuse of client instances within operations

## Change Log

### 2024-01-XX: Initial Implementation
- Basic upload, delete, and SAS URL generation functions
- Module-level environment variable access (caused build issues)

### 2024-01-XX: Runtime-Only Pattern Refactor
- Moved environment variable access to service layer
- Implemented async service functions to defer initialization
- Resolved build-time errors in CI/CD environments

### 2024-01-XX: Performance Optimization
- Simplified service calls to fetch only required data
- Implemented `getContainerClient()` and `getContainerClientWithCredentials()` helpers
- Reduced service calls from 3 to 1 per operation
- Added parallel execution with `Promise.all()`

## Future Enhancements

### Potential Improvements
- Implement blob lifecycle management for automatic cleanup
- Add support for additional file types (Word documents, Excel files)
- Implement chunked uploads for large files
- Add progress tracking for file uploads
- Implement CDN integration for better performance

### Monitoring & Observability
- Add Azure Application Insights integration
- Implement performance metrics tracking
- Add file operation audit logging
- Monitor storage costs and usage patterns 