import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import morgan from "morgan";
import logger from "./utils/logger.js";
import helmet from "helmet";
import "dotenv/config";
import cors from "cors";
import authRouter from "./routes/auth.routes.js";

const app = express();
const PORT = process.env.PORT || 3000;

// middlewares
app.use(helmet());
app.use(cors());
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/v1/auth", authRouter);

// Health Check
app.get("/", (_req, res) => {
  res.status(200).json({
    status: "success",
    message: "API is running",
  });
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({
    message: err.message,
    stack: err.stack,
  });

  res.status(500).json({ error: "Internal Server Error" });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    logger.info(`Server is running on PORT: ${PORT}`);
  });
}

export default app;
