import { Request, Response } from "express";
import { WebhookService } from "../services/webhook.services";

export class WebhookController {
  static async handleClerkEvent(req: Request, res: Response) {
    try {
      await WebhookService.processClerkEvent(req);
      res.json({ received: true });
    } catch (error: any) {
      const status = error.message === "Webhook inválido" ? 400 : 500;
      res.status(status).json({ error: error.message });
    }
  }
}