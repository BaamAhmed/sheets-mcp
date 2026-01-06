# Migration Notes - mcp-handler & Redis Fix

## Summary

This document summarizes the changes made to migrate from `@vercel/mcp-adapter` to `mcp-handler` and fix the Redis connection errors.

## Changes Made

### 1. Package Migration

**Replaced**: `@vercel/mcp-adapter@^0.3.0`  
**With**: `mcp-handler@^1.0.6`

The `@vercel/mcp-adapter` package has been deprecated and replaced by `mcp-handler`, which provides better support for frameworks like Next.js and includes improvements for MCP server functionality.

### 2. Import Statement Update

**File**: `app/api/mcp/route.ts`

```typescript
// Before
import { createMcpHandler } from "@vercel/mcp-adapter";

// After
import { createMcpHandler } from "mcp-handler";
```

### 3. Redis Configuration Fix

**Problem**: The Redis client was attempting to connect even when no Redis URL was provided, causing `ECONNREFUSED` errors that led to timeout issues.

**Solution**: Modified the handler configuration to only include `redisUrl` when it's explicitly set and not empty.

**File**: `app/api/mcp/route.ts`

```typescript
// Before
{
  basePath: "/api",
  verboseLogs: true,
}

// After
{
  // Only include redisUrl if it's actually set and not empty
  ...(process.env.REDIS_URL && { redisUrl: process.env.REDIS_URL }),
  basePath: "/api",
  verboseLogs: true,
}
```

This change ensures that:
- When `REDIS_URL` is not set, the handler works without Redis (suitable for local development)
- When `REDIS_URL` is set to an empty string, it's ignored rather than attempting to connect
- When `REDIS_URL` has a valid value, Redis is used for pub/sub functionality (recommended for production)

### 4. Documentation Updates

Updated `README.md` to:
- Document the optional `REDIS_URL` environment variable
- Clarify that Redis is only needed for production deployments
- Update the credits section to reference `mcp-handler` instead of `@vercel/mcp-adapter`

## Testing

To verify the fix works:

1. **Without Redis** (local development):
   ```bash
   npm run dev
   ```
   The server should start without any Redis errors.

2. **With Redis** (production):
   ```bash
   export REDIS_URL="redis://localhost:6379"
   npm run dev
   ```
   The server should connect to Redis for enhanced pub/sub capabilities.

## Benefits

- **No more Redis errors in local development**: The spamming `ECONNREFUSED` errors are gone
- **Faster connections**: MCP clients can now connect without timeout issues
- **Up-to-date package**: Using the latest recommended package from Vercel
- **Optional Redis**: Redis is now truly optional - use it in production, skip it in development

## Next Steps

1. Test the MCP server with your client to ensure everything works correctly
2. For production deployments on Vercel, consider adding a Redis instance (e.g., Upstash Redis) and setting the `REDIS_URL` environment variable for optimal performance
3. Remove this file after reviewing if desired

## Notes

- The migration is backward compatible - all existing functionality remains the same
- No changes to the tool implementations or API endpoints
- All environment variable configurations remain the same

