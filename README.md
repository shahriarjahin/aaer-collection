# AAER Money Receipt & Collection Management System

An official, secure full-stack web application designed for the **Alumni Association of Agricultural Extension & Rural Development (AAER)** to issue, manage, verify, and print official financial receipts and membership collection vouchers.

---

## 🌟 Key Features

### 1. 📄 Official Money Receipt Voucher Generation
* **Sequential Voucher Numbers**: Automatic formatted voucher IDs (e.g., `REC-2026-0001`, `REC-2026-0002`).
* **Detailed Collection Entry**:
   * Payee Name, Organization, Email, and Phone
  * Amount in BDT (৳) with automatic **Taka in Words** conversion
  * Membership Categories (Life Member, Annual Member, Executive Fee, Donation, Special Fund, General Collection)
  * Payment Methods (Cash, bKash, Nagad, Bank Transfer, Cheque) & Transaction Reference ID
* **Print-Optimized Voucher**: A4 receipt layout complete with official organization header, logo, QR code, and treasurer signature.

### 2. 🔐 Approved User Authentication and Administration
* **Supabase Auth Sign-up**: Anyone can request an account with their name, email, and password.
* **Approval Required**: New accounts remain pending and cannot enter the collection portal until an administrator approves them.
* **Administrator Account**: The `is_admin` flag in `public.approved_users` controls administrator access. There is no browser-local admin PIN.
* **Administrator Workspace**: Administrators can approve pending accounts, edit account names, correct receipt data, delete receipts, print reports, and print blank vouchers.

### 3. 🔍 QR Code Authenticity Verification
* **Embedded QR Code**: Every printed receipt features a unique QR code pointing to the online verification endpoint (`?verifyId=REC-2026-XXXX`).
* **Public Verification**: Anyone can scan the QR code and verify a receipt without logging in. Only safe verification fields are returned; email, phone, and payment-sensitive details remain private.

### 4. 📊 Collection History & Report Dashboard
* **Real-time Filter & Search**: Search collections by Voucher No, Payer Name, or Organization.
* **Financial Summaries**: View total collection metrics, payment method breakdowns, and date range filters.
* **Printable Summary Ledger**: Generate and print official summary reports for audit and committee review.

### 5. 🖨️ Bulk Blank Vouchers Printing
* **Offline Field Collection Ready**: Generate blank money receipt forms with guide lines and checkbox categories for manual pen fill-up during events or field drives.
* **Flexible Page Layouts**: Print 1 per page or 2 per page with dotted cut/tear lines.

### 6. 📷 Dual OCR Voucher Scanner (AI + 100% Offline)
* **Cloud Gemini AI OCR**: High-accuracy recognition for complex handwriting and handwritten Bangladeshi text.
* **100% Offline Tesseract OCR**: Zero-network local client-side recognition using `tesseract.js`. Runs entirely inside the browser without sending document photos to external servers.

### 7. ☁️ Storage & Database Integration
* **Supabase Persistence**: Receipt records are stored in a hosted PostgreSQL database.
* **Database-generated IDs**: Receipt numbers are generated safely by a PostgreSQL sequence.
* **Vercel & Cloud Deployment**: Configured with `vercel.json` and API route proxying.

### 8. ✉️ Automatic Email Delivery
* **Automatic Send**: After a receipt is saved, the payee receives an email when a valid email address is entered.
* **PDF Attachment**: The email includes a branded payee-copy PDF with the receipt details, logo, signature, and verification QR code.
* **Resend from History**: Staff can resend a receipt from the History tab.
* **Delivery Status**: The entry form and History tab show whether delivery succeeded, was skipped, or failed.

---

## 🚀 Getting Started

### Prerequisites
* Node.js v18 or later
* npm / yarn / pnpm

### Installation & Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/aaer-money-receipt.git
   cd aaer-money-receipt
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

4. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

---

## ⚙️ Configure Supabase

Create a Supabase project, open **SQL Editor**, paste the complete contents of [`supabase/schema.sql`](supabase/schema.sql), and click **Run**. Confirm that `public.receipts`, `public.approved_users`, and the `verify_receipt` function exist.

In Supabase Authentication:

1. Disable public sign-ups.
2. Create users manually, or use an administrator-controlled invitation process.
3. Approve each user by inserting their Auth user ID:

```sql
insert into public.approved_users (user_id, email, full_name, approved)
values ('USER_UUID_FROM_SUPABASE', 'user@example.com', 'User Name', true);
```

The browser uses these variables:

```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

The SQL file enables RLS for approved receipt users and creates a restricted public verification function. Do not put a Supabase service-role key in any `VITE_` variable.

After running the schema, create the first administrator manually in the Supabase SQL Editor. Replace the UUID with the Auth user ID of the administrator account:

```sql
update public.approved_users
set approved = true, is_admin = true
where user_id = 'ADMIN_AUTH_USER_UUID';
```

Only an administrator can approve subsequent sign-ups or edit account and receipt data from the Administrator workspace. Keep `is_admin` changes restricted to the Supabase database table.

## ✉️ Configure Resend Email

Create a [Resend](https://resend.com) account, add your sending domain, and complete the DNS verification steps for SPF and DKIM. The sender address must use a verified domain, for example `receipts@example.com`.

Add these server-only variables locally in `.env` and in Vercel Project Settings → Environment Variables:

```env
RESEND_API_KEY="re_your_resend_api_key"
RESEND_FROM_EMAIL="receipts@your-verified-domain.com"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
VITE_APP_URL="https://your-deployed-domain.com"
```

`RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_URL` are server-side values. Never expose them with a `VITE_` prefix and never commit `.env` to source control. Redeploy after changing Vercel environment variables.

The email endpoint is implemented in [`server/receiptEmail.ts`](server/receiptEmail.ts), registered by [`api/index.ts`](api/index.ts), and called by [`src/lib/recordsStore.ts`](src/lib/recordsStore.ts).

---

## 🛠️ Modifying Logos & Signatures

* **Organization Logo**: Replace the image located at `/public/logo.png`.
* **Treasurer / Authority Signature**: Replace the image located at `/public/signature.png`.

---

## 📂 Project Structure

```
├── api/
│   └── index.ts                 # Express Serverless API handlers for receipt storage & deletion
├── public/
│   ├── logo.png                 # Official AAER Organization Emblem
│   └── signature.png            # Official Treasurer Signature graphic
├── src/
│   ├── components/
│   │   ├── AdminLoginModal.tsx          # Passcode authentication & PIN manager modal
│   │   ├── DataEntryForm.tsx            # Money receipt collection entry form
│   │   ├── ReceiptComponent.tsx         # Printable money receipt layout with QR Code
│   │   ├── ReceiptVerificationModal.tsx # QR Verification & Authenticity checker modal
│   │   ├── UserLoginScreen.tsx             # Supabase Auth login screen
│   │   ├── RecordsHistory.tsx           # Collection history, search, and audit dashboard
│   │   └── PrintableReport.tsx          # Formal summary ledger report layout
│   ├── lib/
│   │   ├── adminAuth.ts                 # Admin passcode logic & session state
│   │   ├── auth.ts                         # Supabase Auth and approval helpers
│   │   ├── recordsStore.ts                 # Receipt persistence and email trigger
│   │   └── supabase.ts                  # Supabase client and configuration checks
│   ├── App.tsx                          # Main application layout & state coordinator
│   └── main.tsx                         # React entrypoint
├── supabase/schema.sql           # Supabase receipt table and RLS policy
├── server.ts                    # Node Express backend server
├── server/receiptEmail.ts       # Resend email and branded PDF generation
├── vercel.json                  # Serverless deployment configuration for Vercel
└── README.md                    # Project guide and documentation
```

---

## 🛡️ License

Developed for the **Alumni Association of Agricultural Extension & Rural Development (AAER)**. All rights reserved.
