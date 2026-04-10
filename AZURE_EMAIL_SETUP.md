# Azure Communication Services Email Setup

**Quick guide to set up email notifications using Azure Communication Services**

---

## Why Azure Communication Services?

✅ **Native Azure integration** - No third-party dependencies  
✅ **Cost-effective** - Pay only for what you use  
✅ **Reliable** - Built on Azure's infrastructure  
✅ **Simple API** - Easy to integrate  
✅ **No monthly fees** - Unlike SendGrid's pricing model

**Pricing:** ~$0.000025 per email (1000 emails = $0.025)

---

## Setup Steps

### 1. Create Azure Communication Service

```bash
# Login to Azure
az login

# Create resource group (if you don't have one)
az group create --name nmsl-rg --location eastus

# Create Communication Service
az communication create \
  --name nmsl-communication \
  --resource-group nmsl-rg \
  --data-location UnitedStates
```

**Or via Azure Portal:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource"
3. Search for "Communication Services"
4. Click "Create"
5. Fill in details:
   - **Subscription:** Your subscription
   - **Resource group:** nmsl-rg (or create new)
   - **Name:** nmsl-communication
   - **Data location:** United States
6. Click "Review + create" → "Create"

---

### 2. Get Connection String

**Azure Portal:**
1. Go to your Communication Service resource
2. Click "Keys" in left sidebar
3. Copy "Primary connection string"

**Azure CLI:**
```bash
az communication list-key \
  --name nmsl-communication \
  --resource-group nmsl-rg
```

---

### 3. Set Up Email Domain

#### Option A: Use Free Azure Subdomain (for testing)

1. In your Communication Service, click "Email" → "Domains"
2. Click "Add Domain" → "Azure subdomain"
3. It will create: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.azurecomm.net`
4. Copy the domain name

**From address will be:** `DoNotReply@xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.azurecomm.net`

#### Option B: Use Custom Domain (for production)

1. Click "Add Domain" → "Custom domain"
2. Enter your domain: `nmsl.app`
3. Verify DNS:
   - Add TXT record for domain verification
   - Add SPF record: `v=spf1 include:azurecomm.net ~all`
   - Add DKIM records (provided in portal)
4. Wait for verification (5-30 minutes)

**From address will be:** `noreply@nmsl.app`

---

### 4. Connect Email to Communication Service

1. In Communication Service, click "Email" → "Connect"
2. Select your email domain
3. Click "Connect"

---

### 5. Update Environment Variables

Update your `.env` file:

```bash
# Azure Communication Services Email
AZURE_COMMUNICATION_CONNECTION_STRING=endpoint=https://nmsl-communication.communication.azure.com/;accesskey=your-access-key-here
EMAIL_FROM=DoNotReply@xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.azurecomm.net
```

**Important:** 
- The `EMAIL_FROM` must match exactly with your configured domain
- For Azure subdomain: `DoNotReply@` (case-sensitive!)
- For custom domain: `noreply@nmsl.app`

---

## Testing Email Service

### 1. Start your API

```bash
npm run start:dev
```

You should see in logs:
```
✅ Azure Communication Services Email initialized
```

### 2. Test with an appointment booking

Make a test appointment and have an officer accept it:

```bash
# Login as admin
POST /api/v1/auth/sign-in
{
  "email": "admin@nmsl.app",
  "password": "Admin@123456"
}

# Accept an appointment (replace :id with actual ID)
PATCH /api/v1/admin/appointments/:id/status
{
  "status": "confirmed"
}
```

**Expected result:**
- Patient receives confirmation email ✅
- Doctor receives new appointment notification ✅
- Check logs for `✅ Email sent to...`

---

## Troubleshooting

### Error: "Sender address not authorized"

**Problem:** The `EMAIL_FROM` address doesn't match your verified domain.

**Solution:**
```bash
# Check your email domains
az communication email domain list \
  --resource-group nmsl-rg \
  --email-service-name nmsl-communication

# Update .env with the correct from address
EMAIL_FROM=DoNotReply@your-azure-subdomain.azurecomm.net
```

### Error: "Connection string invalid"

**Problem:** Wrong connection string format or expired key.

**Solution:**
1. Go to Azure Portal → Communication Service → Keys
2. Copy **Primary connection string** (not just the key)
3. Format: `endpoint=https://...;accesskey=...`

### Emails not being received

**Check:**
1. ✅ From address matches verified domain
2. ✅ Connection string is correct
3. ✅ Email domain is connected to Communication Service
4. ✅ Check spam folder
5. ✅ Check Azure Portal → Communication Service → Metrics for delivery status

---

## Production Checklist

Before going live:

- [ ] Set up custom domain (nmsl.app) with DNS verification
- [ ] Update `EMAIL_FROM` to your custom domain
- [ ] Test emails to multiple providers (Gmail, Outlook, Yahoo)
- [ ] Monitor Azure Metrics for delivery rates
- [ ] Set up email templates with your branding
- [ ] Configure SPF, DKIM, and DMARC records
- [ ] Add unsubscribe links if sending marketing emails

---

## Cost Estimation

**Example usage:**
- 100 appointments/day = 200 emails/day (patient + doctor)
- 200 × 30 days = 6000 emails/month
- **Cost:** 6000 × $0.000025 = **$0.15/month**

Compare with SendGrid:
- Free tier: 100 emails/day (not enough)
- Essentials: $19.95/month

**Azure is 133x cheaper!** 💰

---

## Additional Resources

- [Azure Communication Services Documentation](https://docs.microsoft.com/azure/communication-services/)
- [Email SDK Reference](https://docs.microsoft.com/javascript/api/@azure/communication-email/)
- [Pricing Calculator](https://azure.microsoft.com/pricing/details/communication-services/)

---

**Questions?**

Check your logs for detailed error messages. The API will fall back to mock mode (console logs) if Azure is not configured.

---

✅ **Your NMSL API is now using 100% Azure services!**

- Storage: Azure Blob Storage
- Email: Azure Communication Services
- Database: Neon PostgreSQL (or Azure PostgreSQL)
- Hosting: Azure App Service (when deployed)
