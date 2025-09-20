# Fashion App Backend (Express)

Run locally:

1. Create a `.env` file with:

```
PORT=4000
JWT_SECRET=replace-with-32-char-secret
```

2. Install deps and start dev server:

```
npm install
npm run dev
```

Endpoints:
- POST /api/auth/register { email, password, name? }
- POST /api/auth/login { email, password }
- GET /api/auth/me (Authorization: Bearer <token>)
- GET /api/products
- GET /api/products/:id
- POST /api/manage/products (admin only)
- PUT /api/manage/products/:id (admin only)
- DELETE /api/manage/products/:id (admin only)

Notes:
- First registered user is granted role=admin (for convenience).
- Storage is in-memory. Restarting the server resets data.

