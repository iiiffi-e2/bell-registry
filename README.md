# The Bell Registry

The Bell Registry is a high-end, full-stack web application for the luxury private service industry, connecting elite service professionals with prestigious employers.

## Features

### For Candidates
- Secure authentication
- Multi-step profile setup
- Job search and application
- Application tracking
- Profile analytics
- Document management
- Messaging system

### For Employers
- Company profile management
- Job posting and management
- Candidate search and filtering
- Hiring pipeline management
- Analytics dashboard
- Subscription management
- Messaging system

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **File Storage**: AWS S3
- **Styling**: Tailwind CSS, Heroicons

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL
- AWS Account (for S3)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/bell-registry.git
   cd bell-registry
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/bell_registry_db"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   
   # AWS S3 Configuration
   AWS_ACCESS_KEY_ID="your-access-key"
   AWS_SECRET_ACCESS_KEY="your-secret-key"
   AWS_REGION="your-region"
   AWS_BUCKET_NAME="your-bucket-name"
   ```

4. Initialize the database:
   ```bash
   npx prisma db push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
├── lib/                 # Utility functions and configurations
├── providers/          # React context providers
└── types/              # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
