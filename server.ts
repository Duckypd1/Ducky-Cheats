import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies
  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Mocked API route for SePay Webhook
  app.post("/api/webhook/sepay", (req, res) => {
    console.log("Received SePay Webhook:", req.body);
    
    // Example payload from SePay:
    // {
    //   "id": 12345,
    //   "gateway": "Techcombank",
    //   "transactionDate": "2026-03-30 10:00:00",
    //   "accountNumber": "19038271628011",
    //   "code": "FT210330123456",
    //   "content": "DUCKY USER123",
    //   "transferType": "in",
    //   "transferAmount": 200000,
    //   "accumulated": 1500000,
    //   "subAccount": null,
    //   "referenceCode": "MB123456",
    //   "description": "Nhan tien tu Nguyen Van A"
    // }

    const { content, transferAmount, transferType } = req.body;

    if (transferType === "in" && content && content.startsWith("DUCKY ")) {
      const userId = content.split(" ")[1];
      console.log(`Processing top-up for user ${userId}: +${transferAmount}đ`);
      
      // Here you would typically update the user's wallet_balance in Supabase
      // e.g., await supabase.rpc('increment_wallet_balance', { user_id: userId, amount: transferAmount });
      
      return res.json({ success: true, message: "Webhook processed successfully" });
    }

    res.json({ success: false, message: "Ignored or invalid payload" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
