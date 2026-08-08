# AAER Money Receipt & Collection Management System

An official, secure full-stack web application designed for the **Alumni Association of Agricultural Extension & Rural Development (AAER)** to issue, manage, verify, and print official financial receipts and membership collection vouchers.

---

## 🌟 Key Features

### 1. 📄 Official Money Receipt Voucher Generation
* **Sequential Voucher Numbers**: Automatic formatted voucher IDs (e.g., `REC-2026-0001`, `REC-2026-0002`).
* **Detailed Collection Entry**:
  * Payer Name & Organization/Designation
  * Amount in BDT (৳) with automatic **Taka in Words** conversion
  * Membership Categories (Life Member, Annual Member, Executive Fee, Donation, Special Fund, General Collection)
  * Payment Methods (Cash, bKash, Nagad, Bank Transfer, Cheque) & Transaction Reference ID
* **Print-Optimized Voucher**: A4/A5 receipt layout complete with official organization header, logo, and treasurer signature.

### 2. 🔐 Admin Security & Passcode Authorization
* **Authorized Printing & Deletion**: Requires Admin passcode authentication before generating receipts or modifying records.
* **Default Passcode**: `1234`
* **Passcode Customization**:
  * **Via UI**: Click **Admin Login** in the top navigation bar, enter the current PIN, and select **Change Passcode?** to set a new PIN.
  * **Via Code**: Change `DEFAULT_PIN` in `src/lib/adminAuth.ts`.

### 3. 🔍 QR Code Authenticity Verification
* **Embedded QR Code**: Every printed receipt features a unique QR code pointing to the online verification endpoint (`?verifyId=REC-2026-XXXX`).
* **Verification Modal**: Scanning the QR code or searching via the **Verify QR** button queries the central database to check if the receipt is genuine, displaying verified payer details and issue dates to prevent forgery.

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

Create a Supabase project, open **SQL Editor**, paste the complete contents of [`supabase/schema.sql`](supabase/schema.sql), and click **Run**. Confirm that `public.receipts` appears under **Table Editor**. Then add these variables to `.env` locally or to your Vercel project settings:

```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

The browser uses the Supabase anon key and the SQL file enables the required RLS policy for the public receipt verification workflow. Do not put a Supabase service-role key in `VITE_` variables.

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
│   │   ├── RecordsHistory.tsx           # Collection history, search, and audit dashboard
│   │   └── PrintableReport.tsx          # Formal summary ledger report layout
│   ├── lib/
│   │   ├── adminAuth.ts                 # Admin passcode logic & session state
│   │   └── supabase.ts                  # Supabase client and configuration checks
│   ├── App.tsx                          # Main application layout & state coordinator
│   └── main.tsx                         # React entrypoint
├── supabase/schema.sql           # Supabase receipt table and RLS policy
├── server.ts                    # Node Express backend server
├── vercel.json                  # Serverless deployment configuration for Vercel
└── README.md                    # Project guide and documentation
```

---

## 🛡️ License

Developed for the **Alumni Association of Agricultural Extension & Rural Development (AAER)**. All rights reserved.
