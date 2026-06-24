# SPRINT 1 COMPLETE - HANDOFF DOCUMENT

This document serves as the official engineering handoff and source of truth for the current state of the PDF Studio application upon the completion of Sprint 1.

## 1. Current Architecture
- **Framework**: Next.js 16.2.9 (App Router, Turbopack)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma 5.22.0
- **Cache / Message Broker**: Redis (container active, pending BullMQ integration)
- **Authentication**: Auth.js (NextAuth v5) using JWT strategy and Credentials provider (bcrypt).
- **Styling**: Tailwind CSS 3.4.19 (using custom "Studio Precision" theme variables)
- **Deployment Strategy**: Containerized infrastructure via Docker Compose for local development.

## 2. Database Schema
The database schema is managed by Prisma and currently defines the following core models:
- **User**: Core authentication identity (id, email, passwordHash, name, role).
- **File**: Tracks all uploaded and generated files (userId, fileName, originalName, fileSize, mimeType, storagePath).
- **Job**: Tracks asynchronous operations (userId, fileId, type, status, progress, result).
- **Subscription**: Tracks user billing limits (plan, storageUsed, storageLimit).
- **AIChat & ChatMessage**: Future tables prepared for AI workflows.

## 3. Implemented Routes
### Frontend (UI)
- `/`: Dashboard (protected workspace showing storage quota, recent documents, and tool links).
- `/login`: User sign-in interface.
- `/signup`: User registration interface with successful UX state.
- `/tools/merge-pdf`: Interface for selecting, sorting, and merging multiple PDF documents.

## 4. APIs
All APIs are located in `app/api/`:
- `POST /api/auth/register`: Handles user creation (bcrypt hashing, Prisma user creation).
- `POST /api/auth/[...nextauth]`: Auth.js handlers for session management.
- `POST /api/upload`: Handles multipart/form-data uploads, saving files to local `/storage/uploads`.
- `POST /api/tools/merge`: Accepts an array of file IDs, processes the merge using `pdf-lib`, saves to `/storage/processed`, and returns the new file record.
- `GET /api/files/[id]`: Serves physical files from disk. Supports `?action=download` for attachments and standard inline viewing.
- `DELETE /api/files/[id]`: Securely deletes a file record from the database and removes the physical file from the storage directory.

## 5. Docker Configuration
- **PostgreSQL (`pdfstudio-postgres`)**:
  - Image: `postgres:15-alpine`
  - Ports: Mapped to `5440:5432` on the host to avoid native Windows `postgres.exe` conflicts.
  - Data: Persisted via Docker volume `pgdata`.
- **Redis (`pdfstudio-redis`)**:
  - Image: `redis:7-alpine`
  - Ports: Mapped to `6379:6379`.
  - Data: Persisted via Docker volume `redisdata`.
- **Environment**: All services are orchestrated via `docker-compose.yml`.

## 6. Authentication Flow
1. User accesses `/signup`.
2. Client sends credentials to `POST /api/auth/register`.
3. Server hashes the password with `bcryptjs` (dynamic import to bypass Edge runtime restrictions) and creates the User record.
4. User logs in via `/login`.
5. Auth.js intercepts credentials, compares the hash via `bcryptjs`, and issues a signed JWT token.
6. The JWT session is persisted across server components and client boundaries.

## 7. File Storage Flow
1. User uploads a file via the client.
2. `POST /api/upload` intercepts the `FormData`.
3. The server writes the physical binary data to the root `/storage/uploads` directory.
4. The server creates a `File` record in PostgreSQL linked to the user's ID containing metadata and the absolute `storagePath`.
5. To view or download, the client queries `GET /api/files/[id]`, which reads the binary from `storagePath` and serves it securely.

## 8. Merge PDF Workflow
1. User uploads 2+ PDFs on `/tools/merge-pdf`.
2. The UI orchestrates the initial upload via `POST /api/upload` and retrieves the new DB File IDs.
3. The UI sends the File IDs to `POST /api/tools/merge`.
4. The server validates ownership, reads the physical files into memory using `pdf-lib`, and constructs a new merged PDF.
5. The merged binary is written to `/storage/processed`.
6. The server records the new File and a completed Job in the database.
7. The UI captures the merged file payload and presents a success state with Download, View, and Dashboard buttons.

## 9. Known Issues
- Build warnings exist due to the presence of both `package-lock.json` and `pnpm-lock.yaml`. Turbopack requires a single package manager resolution.
- Node module compatibility (`bcryptjs` vs `bcrypt`, edge vs node runtime) in Next.js requires strict `force-dynamic` and dynamic `await import()` wrappers inside API routes to avoid Webpack/Turbopack evaluation crashes.

## 10. Technical Debt
- **Storage Strategy**: Currently utilizing local file storage (`/storage`). This cannot scale horizontally in a serverless/multi-container environment. Requires migration to an S3-compatible service (e.g., Cloudflare R2).
- **Synchronous Processing**: PDF merging is currently synchronous within the API route. Large files could cause HTTP timeouts or Vercel edge function limits.
- **Error Handling**: While improved in the register route, unified API error handling and validation (e.g., via Zod) is not universally applied.

## 11. Sprint 2 Roadmap
1. **Background Job Processing**: Implement BullMQ workers using the existing Redis container to process heavy PDF operations asynchronously.
2. **Additional Core Tools**: Implement Split PDF, Compress PDF, PDF to Image, and Word to PDF capabilities.
3. **Storage Migration**: Integrate Cloudflare R2 or AWS S3 for robust object storage and signed URLs.
4. **Subscription Tier Locks**: Implement logic to enforce the 2GB free storage limit and cap tool usage based on the user's `PlanType`.
5. **AI Preparation**: Scaffold the `AIChat` interfaces and prepare for OpenAI/Anthropic embeddings for document RAG.
