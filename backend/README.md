# Travel Backend - NestJS + MariaDB

This is a conversion of a FastAPI (MongoDB) travel backend into NestJS + TypeORM with MariaDB.

Quick start:
1. `npm install`
2. configure `.env`
3. create the MariaDB database (e.g., `travel_db`)
4. `npm run start:dev`

Note: TypeORM `synchronize: true` is enabled for quick setup. Turn it off for production.

File uploads now use Amazon S3. Set these environment variables in `.env`:
```
AWS_REGION=your-region
AWS_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```
