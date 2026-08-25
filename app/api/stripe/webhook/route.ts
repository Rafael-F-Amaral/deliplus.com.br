import { processStripeWebhookEvent } from "@/lib/billing/webhooks"
import { StripeConfigurationError } from "@/lib/stripe/config"
import {
  StripeWebhookSignatureError,
  verifyStripeWebhookEvent,
} from "@/lib/stripe/webhook"

export const runtime = "nodejs"

function serverErrorResponse() {
  return Response.json(
    { error: "Stripe webhook processing failed" },
    { status: 500 }
  )
}

function invalidSignatureResponse() {
  return Response.json(
    { error: "Invalid Stripe webhook signature" },
    { status: 400 }
  )
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get("stripe-signature")
  let event

  if (!signature) {
    return invalidSignatureResponse()
  }

  try {
    event = verifyStripeWebhookEvent(rawBody, signature)
  } catch (error) {
    if (error instanceof StripeWebhookSignatureError) {
      return invalidSignatureResponse()
    }

    if (error instanceof StripeConfigurationError) {
      return serverErrorResponse()
    }

    return serverErrorResponse()
  }

  try {
    await processStripeWebhookEvent(event)
  } catch (error) {
    console.error("Stripe webhook processing failed", {
      eventId: event.id,
      eventType: event.type,
      errorName: error instanceof Error ? error.name : "UnknownError",
    })

    return serverErrorResponse()
  }

  return Response.json({ received: true })
}
