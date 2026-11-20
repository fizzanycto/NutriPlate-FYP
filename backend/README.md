# NutriPlate - Backend (Phase 2)
1. Start AI service first (Phase 1) on port 8000.
2. cd backend
   npm install
   npm run seed      (demo data - run once)
   npm start         (http://localhost:4000)
Demo logins (password 123456): admin@nutriplate.com, patient@nutriplate.com, p1@nutriplate.com ... p5@nutriplate.com
Test (AI service must be running): npm test

Firebase (optional, later): put serviceAccountKey.json in this folder, set DB_MODE=firebase in .env, run npm run seed again.
