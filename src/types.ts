export type MembershipNature =
  | 'Life Member'
  | 'General'
  | 'AGM'
  | 'Conference'
  | 'Other';

export type PaymentMethod = 'Cash' | 'Cheque' | 'bKash' | 'Nagad';

export interface ReceiptFormData {
  name: string;
  organization: string;
  membershipNature: MembershipNature;
  emailAndCell: string;
  amount: string | number;
  numberOfPersons: string | number;
  amountInWords: string;
  paymentMethod: PaymentMethod;
  chequeNumberAndDate?: string;
  bankName?: string;
  remarks?: string;
}

export interface ReceiptRecord extends ReceiptFormData {
  id: string;
  timestamp: string;
}
