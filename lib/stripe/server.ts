import "server-only"

import Stripe from "stripe"

import { getStripeSecretKey } from "./config"

let stripeClient: Stripe | undefined

export function getStripe() {
  stripeClient ??= new Stripe(getStripeSecretKey())

  return stripeClient
}
