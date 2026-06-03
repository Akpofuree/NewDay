# NewDay Backend Deployment

## Required Environment

- `DATABASE_URL`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `ANTHROPIC_API_KEY`
- `APP_URL`
- `ALLOWED_ORIGINS`

Optional email reset delivery:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Optional critical alert forwarding:

- `CRITICAL_ALERT_WEBHOOK_URL`

## Railway Or Render

1. Provision a PostgreSQL database.
2. Add the environment variables above.
3. Build command: `npm run build`
4. Start command: `npm start`

`npm start` runs `prestart`, which applies database migrations from `dist/migrate.cjs` before the new server boots. The server also runs migrations on startup as a second safety net.

## Rollback Strategy

Use platform-native deploy history:

- Railway: redeploy the previous successful deployment.
- Render: use manual deploy rollback to a previous build.

Migrations in this project are additive. Avoid destructive schema changes without a separate backfill and rollback plan.
