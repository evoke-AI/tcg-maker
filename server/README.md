# Evoke AI Web App Template with Authentication

This is a [Next.js](https://nextjs.org) project template that includes authentication, SQLite for development, and Azure SQL Server support for production. It comes with a pre-configured login system and a modern UI using Tailwind CSS.

> ### 🔑 Quick Start Login
> Ready to test? Use these default credentials to log in:
> ```
> 📧 Email: admin@evoke-ai.co
> 🔒 Password: qwerty
> ```
> ⚠️ Important: Remember to change these credentials before deploying to production!

## Features

- 🔐 Built-in authentication with NextAuth.js
- 📱 Responsive design
- 🎨 Modern UI with Tailwind CSS
- 🔄 SQLite for development
- ☁️ Azure SQL Server ready for production
- 🚀 Optimized for performance

## Getting Started

### Use the setup script

Download the setup script from [here](https://github.com/evoke-AI/web-app-template/blob/main/setup-project.ps1) and run it in an elevated PowerShell session

### Manual Setup

1. Clone this repository:

```bash
git clone git@github.com:evoke-AI/web-app-template.git
cd web-app-template
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up your environment variables:

```bash
cp .env.example .env
```

4. Initialize the database:

```bash
pnpm prisma migrate dev
```

5. Run the development server:

Use the built-in Visual Studio Code debugger

![readme/images/vscode-debug.png](readme/images/vscode-debug.png)

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `/app` - Application routes and pages
  - `/api` - API routes including authentication
  - `/components` - Reusable UI components
  - `/login` - Authentication page
- `/prisma` - Database schema and migrations
- `/public` - Static assets

## Authentication

This template uses NextAuth.js for authentication:
- Email/Password authentication
- Session-based authentication
- Protected routes
- Role-based access control

### Create new Production Login

```sql
-- Create new Login to master database
CREATE LOGIN [devLogin] WITH PASSWORD = 'some-random-password';

-- Create new User to target database
CREATE USER [devUser] FOR LOGIN [devLogin];

-- Permissions
EXEC sp_addrolemember 'db_datareader', 'devUser';
EXEC sp_addrolemember 'db_datawriter', 'devUser';
```

## Customization

1. **Database Schema**: Edit `prisma/schema.prisma` and `prisma/schema.sqlserver.prisma` to modify the data model
2. **Styling**: Update Tailwind classes or modify `tailwind.config.js`
3. **Components**: Add or modify components in the `/app/components` directory
4. **Authentication**: Extend NextAuth.js configuration in `/app/api/auth/[...nextauth]/route.ts`

## Production Deployment

1. Build the application:

```bash
pnpm build
```

2. Start the production server:

```bash
pnpm start
```

The application is ready to be deployed to Azure Web Apps.

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
