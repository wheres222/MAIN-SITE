import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Cheat Paradise refund policy — all sales are final. Read our strict no-refund policy, delivery failure procedures, and chargeback consequences before purchasing.",
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <InfoPage
      title="Refund Policy"
      subtitle="Last updated: May 2025. Please read this policy in full before placing any order. All purchases are subject to these terms."
      sections={[
        {
          heading: "1. All Sales Are Final",
          body: [
            "All purchases made on Cheat Paradise are strictly final and non-refundable. By completing a purchase, you explicitly acknowledge that you have read, understood, and agreed to this policy in its entirety.",
            "We do not offer refunds, exchanges, credits, or partial reimbursements under any circumstances once an order has been placed and payment has been processed. This applies regardless of the reason, including but not limited to: change of mind, dissatisfaction with product performance, game account bans, game updates that affect product functionality, or inability to use the product.",
            "This policy exists because our products are digital goods delivered instantly and electronically. Once a license key, activation code, or access credential has been issued, it is consumed and cannot be revoked, re-issued, or resold.",
          ],
        },
        {
          heading: "2. Why Refunds Are Not Possible",
          body: [
            "Digital goods differ fundamentally from physical products. The moment your order is confirmed, the product is delivered to you electronically. There is no physical item to return, no inventory to restock, and no way to verify that a delivered license has not been used.",
            "In most jurisdictions, digital goods that have been delivered and accessed are explicitly exempt from standard consumer cooling-off periods and return rights. By choosing to purchase a digital product from this Site, you waive any statutory right of withdrawal that may otherwise apply.",
            "Our products may also be time-sensitive — a cheat or utility that is undetected today may face detection or updates within days. The nature of the software market means functionality cannot be guaranteed indefinitely, and this uncertainty is reflected in our pricing and is understood by all parties at the time of purchase.",
          ],
        },
        {
          heading: "3. Game Bans and Account Consequences",
          body: [
            "Cheat Paradise is not responsible for any consequences you experience as a result of using our products, including but not limited to: game account bans, temporary or permanent suspensions, hardware identification bans, loss of in-game items or progress, or penalties imposed by game developers or anti-cheat providers.",
            "You acknowledge at the time of purchase that the use of third-party software may violate a game's End User License Agreement and that you accept full responsibility for any resulting consequences. A game ban or account suspension is not grounds for a refund under any circumstances.",
          ],
        },
        {
          heading: "4. Product Updates and Detection",
          body: [
            "Our products may become temporarily unavailable, require updates, or cease to function following game patches, game updates, or changes to anti-cheat systems. This is inherent to the nature of the software category and is not considered a defect or failure on our part.",
            "We make no guarantees about how long any product will remain functional or undetected. Subscription-based products may be paused during maintenance periods, but product updates do not entitle users to refunds for any unused portion of a subscription.",
          ],
        },
        {
          heading: "5. Non-Delivery — Verified Technical Failures",
          body: [
            "The only scenario in which a remedy may be considered is where you genuinely did not receive your product due to a verified technical failure on our end — for example, a payment was processed but no license key was issued due to a system error.",
            "If you believe this has occurred, you must open a support ticket within 24 hours of the transaction timestamp. You must provide: your order ID or payment reference, the email address used for the purchase, and a clear description of the issue. Requests submitted after 24 hours will not be reviewed.",
            "Upon investigation, if a delivery failure is confirmed, we will re-deliver the product. We will not issue monetary refunds even in confirmed non-delivery cases — the remedy is re-delivery only.",
          ],
        },
        {
          heading: "6. Duplicate Charges",
          body: [
            "If your payment provider processed the same order more than once due to a technical error, contact us immediately with your order ID and evidence of the duplicate transaction (e.g. two matching payment references for the same product on the same date).",
            "Duplicate charge claims will be reviewed against our transaction records. If confirmed, the duplicate charge will be refunded via the original payment method. This is the only scenario in which a monetary refund may be issued and it applies only to the exact duplicate amount — not the original transaction.",
          ],
        },
        {
          heading: "7. Chargebacks and Payment Disputes",
          body: [
            "Initiating a chargeback, payment reversal, or dispute with your bank or payment processor without first contacting our support team is a violation of these terms and will result in immediate, permanent termination of your account and a ban from all Cheat Paradise services — including any future accounts.",
            "We maintain complete and detailed transaction records for every order, including IP addresses, device identifiers, timestamps, delivery confirmations, and communication logs. We will respond to every chargeback with full documentation and evidence of delivery.",
            "Fraudulent chargebacks — where a product was received and used but a dispute is filed claiming non-delivery or unauthorised transaction — may be reported to relevant fraud prevention agencies and may constitute criminal fraud depending on your jurisdiction.",
            "If you have a genuine concern about a charge, contact our support team first. We are far more capable of resolving legitimate issues quickly through direct communication than through a formal dispute process.",
          ],
        },
        {
          heading: "8. Account Balance and Store Credits",
          body: [
            "Any balance held in your Cheat Paradise account is non-refundable and non-withdrawable. Account balance may be used to purchase products on this Site only. Account balance has no cash value and cannot be transferred to another user.",
            "In the event of account termination due to a violation of our Terms of Service, any remaining account balance is forfeited without compensation.",
          ],
        },
        {
          heading: "9. Subscription Products",
          body: [
            "Where products are sold on a recurring subscription basis, you are billed at the start of each billing cycle and that cycle is non-refundable in full. Cancelling a subscription stops future billing but does not entitle you to a pro-rata refund for any unused portion of the current billing period.",
            "It is your responsibility to cancel a subscription before the renewal date if you no longer wish to be charged.",
          ],
        },
        {
          heading: "10. Modifications to This Policy",
          body: [
            "We reserve the right to update this Refund Policy at any time. Changes take effect immediately upon posting to the Site. The policy that was in effect at the time of your purchase governs that transaction. It is your responsibility to review this policy before each purchase.",
          ],
        },
        {
          heading: "11. Contact",
          body: [
            "If you have a question about an order or this policy before purchasing, we encourage you to reach out before completing your transaction. Contact us via the Support page or join our Discord server. We respond to most enquiries within 24 hours.",
          ],
        },
      ]}
    />
  );
}
