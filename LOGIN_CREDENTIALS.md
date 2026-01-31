# Login Credentials for Testing

## Demo Account 1
- **Email**: demo@example.com
- **Password**: Demo@123456

## Demo Account 2
- **Email**: test@example.com
- **Password**: Test@123456

## How to Reset Database

If you want to reset and seed the database again, run:

```bash
cd server
npm run seed
```

This will:
1. Create the database tables
2. Add demo users for testing
3. Clear any existing demo users and recreate them

## Application URLs

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **API Base**: http://localhost:5000/api

## Database

The application uses SQLite database stored at `data/bill-reminder.db`.

To completely reset the database:
1. Delete the `data/bill-reminder.db` file
2. Run `npm run seed` in the server directory
3. Restart the backend server
