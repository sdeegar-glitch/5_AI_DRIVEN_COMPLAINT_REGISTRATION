declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        role: "USER" | "ADMIN";
      };
    }
    interface Response {
      success(data: any, message?: string): void;
      fail(message: string, error?: any, statusCode?: number): void;
    }
  }
}

export {};
