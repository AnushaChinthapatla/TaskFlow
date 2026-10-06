# TaskFlow — Full-Stack Task Management App

A full-stack task manager with a **Kanban board**, categories, filtering/search and **JWT authentication**.
Every user only ever sees their own data.

**Stack:** ASP.NET Core 8 Web API · C# · Entity Framework Core · SQL Server · React 18 · TypeScript · Tailwind CSS · JWT

## Features
- Register / login with BCrypt-hashed passwords and JWT bearer tokens
- Protected routes on the frontend; `[Authorize]` + per-user query filtering on the backend
- Full CRUD for tasks and categories (title, description, status, priority, due date, category)
- Kanban board (To do / In progress / Done) with optimistic status moves
- Search (debounced), filter by category and priority, sort by newest / due date / priority
- Dashboard stats: totals, overdue count and completion progress
- Swagger UI with a JWT "Authorize" button, validation errors surfaced in the UI

## Architecture
```
TaskFlow/
├── backend/TaskFlow.Api      Controllers · Data (EF Core DbContext) · Dtos · Models · Services (JWT)
└── frontend                  Vite + React + TS: pages, components, typed API client, AuthContext
```
**Database (normalized, 3 tables):** `Users 1─* Tasks`, `Users 1─* Categories`, `Categories 1─* Tasks (optional)`.
Unique index on `Users.Email` and on `(Categories.UserId, Name)`.

## Run it locally
**Prerequisites:** .NET 8 SDK, Node 18+, SQL Server (LocalDB on Windows, or Docker below).

```bash
# 1. Backend
cd backend/TaskFlow.Api
dotnet tool install --global dotnet-ef        # once
dotnet ef migrations add InitialCreate
dotnet run                                    # http://localhost:5080/swagger (applies migrations in Development)

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev                                   # http://localhost:5173
```

**No LocalDB? Use SQL Server in Docker** and change `ConnectionStrings:Default` in `appsettings.json`:
```bash
docker run -e ACCEPT_EULA=Y -e MSSQL_SA_PASSWORD='Your_strong_Pass123' -p 1433:1433 -d mcr.microsoft.com/mssql/server:2022-latest
# Server=localhost,1433;Database=TaskFlowDb;User Id=sa;Password=Your_strong_Pass123;TrustServerCertificate=True
```

**Secrets:** replace the JWT key before deploying: `dotnet user-secrets set "Jwt:Key" "<random 32+ char string>"`.

## API
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | Create account / sign in → JWT |
| GET | `/api/auth/me` | Current user |
| GET | `/api/tasks?status=&priority=&categoryId=&search=&sort=` | List (filtered) |
| GET | `/api/tasks/stats` | Counts + overdue |
| POST / PUT / DELETE | `/api/tasks`, `/api/tasks/{id}` | Create / update / delete |
| PATCH | `/api/tasks/{id}/status` | Move between columns |
| GET / POST / PUT / DELETE | `/api/categories` | Manage categories |

## Design decisions (good interview talking points)
- **Authorization at the query level:** every query filters on the JWT's user id, so another user's id returns 404 rather than leaking data.
- **DTOs/records** keep EF entities (and password hashes) off the wire; DataAnnotations give automatic 400 validation.
- **Deleting a category keeps its tasks** (un-categorised) — `NoAction` FK avoids SQL Server multiple-cascade-path errors.
- **Same error for wrong email vs wrong password** to prevent account enumeration.
- **Frontend:** typed API client with central 401 handling (auto sign-out), optimistic UI, debounced search.

## Ideas to extend
Refresh tokens, drag-and-drop (dnd-kit), unit tests (xUnit + EF InMemory / Vitest), Docker Compose, CI with GitHub Actions, deployment (Azure App Service + Static Web Apps).
