# 🚀 Crypto Exchange Backend
## 📖 API Documentation
Full API documentation available at:
📄 ./API.md

## 🐳 Run with Docker (PostgreSQL)
### 1️⃣ Start Database
```
docker compose up -d
```
### 2️⃣ Setup Environment Variables
Create .env file:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5555/crypto_exchange_dev"
JWT_SECRET="your_super_secret_key"
PORT=3000
```
### 3️⃣ Install Dependencies
```
npm install
```
### 4️⃣ Run Prisma Migration
```
npx prisma migrate dev
```
### 5️⃣ Generate Prisma Client
```
npx prisma generate
```
### 6️⃣ Seed Database
```
npx prisma db seed
```
### 7️⃣ Start Development Server
```
npm run dev
```
Server will run on:
```
http://localhost:3000
```





