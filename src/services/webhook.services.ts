import { Request } from "express";
import { Webhook } from "svix";
import { UserRepository } from "../repositorys/user.repository";

export class WebhookService {
  static async processClerkEvent(req: Request) {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) throw new Error("CLERK_WEBHOOK_SECRET no configurado");

    const wh = new Webhook(secret);
    let event: any;

    try {
      event = wh.verify(req.body, {
        "svix-id":        req.headers["svix-id"] as string,
        "svix-timestamp": req.headers["svix-timestamp"] as string,
        "svix-signature": req.headers["svix-signature"] as string,
      });
    } catch {
      throw new Error("Webhook inválido");
    }

    if (event.type === "user.updated") {
      const { id, first_name, last_name, image_url } = event.data;

      await UserRepository.updateByClerkId(id, {
        name:      `${first_name ?? ""} ${last_name ?? ""}`.trim(),
        photoUrl:  image_url,
        updatedAt: new Date(),
      });
    }
  }
}