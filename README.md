# Backend: Multi-Tenant Booking System

This Node.js and Express.js backend serves as the core of the Multi-Tenant Booking System. It is designed with a robust, tenant-aware architecture to ensure complete data isolation and provides a powerful AI-assisted booking feature.

## Core Architecture

The backend is built around a "Tenant Context" model, which is enforced at the API level to ensure strict data partitioning between tenants.

1.  **Tenant-Scoped Middleware:** A primary middleware, `findTenant`, is used in `routes.js` for all tenant-specific routes (e.g., `/api/:tenantId/...`). This middleware intercepts every request to validate the `tenantId` from the URL. If the tenant is valid, the tenant object is attached to the request (`req.tenant`), making it available to all subsequent logic. If the tenant is invalid, the request is immediately rejected with a `404 Not Found` error.

2.  **Data Isolation:** All database queries and data filtering operations strictly use the `tenantId` from the validated request context. For example, when fetching resources, the logic is equivalent to `resources.filter(r => r.tenantId === req.tenant.id)`. This server-enforced filtering makes it impossible for one tenant to access another's data.

3.  **Authentication (JWT):** User authentication is handled via JSON Web Tokens. The `/api/auth/login` endpoint validates user credentials and issues a token containing the `userId` and `tenantId`. This token is required for all protected routes, and the `authMiddleware` ensures that the user's `tenantId` in the token matches the `tenantId` in the URL, preventing users from accessing other tenants' APIs even with a valid token.

## AI Service Integration

A key feature is the AI Booking Assistant, powered by the Google Gemini API.

-   **AI Endpoint (`/api/:tenantId/ai/assistant`):** This route receives natural language queries from the frontend.
-   **System Prompt (`ai-prompt.js`):** Before sending a query to Gemini, a detailed system prompt is dynamically generated. This prompt provides the AI with all the necessary context, including the current tenant's resources, all existing bookings (for conflict checking), and the user's own bookings.
-   **Structured JSON Responses:** The prompt instructs the AI to respond only in a structured JSON format with a specific `action` (`book`, `suggest`, `answer`). This allows the backend to reliably interpret the AI's intent and perform the correct action, such as creating a booking or suggesting alternative times.
-   **`ai-service.js`:** This service manages the communication with the Gemini API, sends the constructed prompt, and parses the JSON response.

## Environment Variables

To connect to the Google Gemini API, you must create a `.env` file in the `/backend` directory with the following variable:

```
GOOGLE_API_KEY="YOUR_GEMINI_API_KEY_HERE"
```

## Setup and Running

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    The backend will run on `http://localhost:3000`.
    ```bash
    npm run dev
    ``` 