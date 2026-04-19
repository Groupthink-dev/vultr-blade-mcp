---
title: Vultr GPU Cloud Setup
form_step: enter-credentials
---

## Create a Vultr account

Sign up at [vultr.com](https://www.vultr.com/) if you don't have an account.

You'll need a payment method on file before you can create GPU instances. Vultr supports credit card and PayPal.

GPU instances (A100, L40S, A16) start from ~$0.70/hr. Billing begins immediately on creation and stops on deletion.

## Generate an API key

1. Go to [Account Settings > API](https://my.vultr.com/settings/#settingsapi)
2. Click **Enable API** if not already enabled
3. Your API key is displayed — copy it now (it won't be shown again in full)
4. Under **Access Control**, add your IP address or select "Allow All IPv4" for development

The API key provides full account access including creating and deleting instances. Keep it secure.

## Enter credentials

Paste your API key below. The connection test verifies your key against the Vultr API before saving.

Your API key is encrypted at rest using the Secure Enclave — it never touches disk in plaintext and is only decrypted in-process when the MCP server starts. The key is not synced, exported, or accessible to other plugins.

Write operations (create, delete, start, stop, reboot) are disabled by default. Set `VULTR_WRITE_ENABLED=true` in your environment to enable them — each write call also requires explicit `confirm: true` as a second safety gate.
