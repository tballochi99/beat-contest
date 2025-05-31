# Beat Contest Platform

A platform for anonymous beat-making competitions where producers compete on themed challenges.

## Features

- 3-day contest cycles with automatic progression
- Anonymous beat submissions and voting
- Multiple rounds with automatic elimination
- User profiles with statistics and social links
- Leaderboard and hall of fame
- Cloud storage for audio files
- Secure authentication system

## Tech Stack

- Frontend: Next.js (React + API routes)
- Backend: Next.js API routes
- Database: MongoDB Atlas
- File Storage: Cloudinary
- Authentication: NextAuth.js
- Styling: Tailwind CSS

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/              # Next.js 13+ app directory
├── components/       # React components
├── lib/             # Utility functions
├── models/          # MongoDB models
├── pages/           # API routes
└── styles/          # Global styles
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 