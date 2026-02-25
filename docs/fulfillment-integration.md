# Fulfillment Integration Contract

This frontend is expected to redirect users to checkout, then poll fulfillment status by `order_id` + `token`.

## Status endpoint

`GET https://cheatparadise.com/order/{order_id}/{token}`

Possible responses:

- `{"status":"pending"}`
- `{"status":"processing"}`
- `{"status":"ready","key":"..."}`
- `{"status":"failed","error":"..."}`

## Frontend polling behavior

- Poll every 2-3 seconds after checkout redirect
- Stop polling when `status` is `ready` or `failed`
- Show loading UI for `pending`/`processing`
- Show key/download UI for `ready`
- Show support CTA for `failed`

## Required redirect parameters

The confirmation page must receive:

- `order_id`
- `token`

Example:

`/order-complete?order_id=ABC123&token=xyz789`

## Security notes

- Do not expose secret keys in client code
- Treat `token` as sensitive order access secret
- Rotate leaked API keys immediately
