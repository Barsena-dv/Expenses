// Local dev entry point — not used in Vercel deployment
import app from "./app.js";

const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error(`   On macOS, port 5000 is reserved by AirPlay Receiver (ControlCenter).`);
    console.error(`   Fix: Set PORT=5001 in your .env, or change the PORT value.\n`);
    process.exit(1);
  } else {
    throw err;
  }
});
