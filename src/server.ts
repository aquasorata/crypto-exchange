import "dotenv/config";
import app from "./app";
import { prisma } from "./shared/prisma";

const PORT = process.env.PORT || 6000;

async function startServer() {
  try {
    await prisma.$connect();
    console.log("Database connected");
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

startServer();

// Shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});