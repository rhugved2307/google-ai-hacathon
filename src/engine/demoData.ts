import type { PresetKey, UploadedFileType } from './types';

/**
 * Fictional sample data for demonstrating VELTRIX detection and redaction locally.
 * Contains zero real personal information.
 */
export const DEMO_TEXT_SAMPLE = `Customer Information:

Name: Rahul Sharma

Email: rahul.sharma@gmail.com

Phone: +91 9876543210

Aadhaar: 1234 5678 9012

PAN: ABCDE1234F

UPI: rahul@oksbi

Credit Card: 4111 1111 1111 1111

IP Address: 192.168.1.25

Date of Birth: 12/05/2005

Address: 12 MG Road, Pune, Maharashtra

Passport: A1234567

Bank Account Number: 123456789012

PIN Code: 411001`;

/**
 * Fictional sample CSV dataset including quoted commas, escaped quotes, and multiline address cell.
 */
export const DEMO_CSV_SAMPLE = `Name,Email,Phone,PAN,UPI,Address,City,Department
Rahul Sharma,rahul.sharma@gmail.com,+91 9876543210,ABCDE1234F,rahul@oksbi,"12 MG Road, Camp, Pune",Pune,Engineering
Priya Deshmukh,priya.d@company.co.in,9823456789,BCPDE4321K,priya@okhdfcbank,"Flat 4B, ""Green"" Apartments,
Kothrud, Pune",Pune,Product
Amit Patil,amit.patil@example.org,+91-9765432109,APQRS9876M,9765432109@paytm,"123 Main Street, Andheri West, Mumbai",Mumbai,Operations
Sneha Kulkarni,sneha.k@workmail.in,09811223344,CDEFG5678P,sneha@ybl,"Plot 9, Baner Road, Pune",Pune,Finance`;

export const SUPPORT_LOG_PRESET = `[2026-11-26 14:22:08] Ticket #4821
Customer: Priya Deshmukh
Email: priya.deshmukh@company.co.in
Backup Email: priya.d@gmail.com
Phone: +91 9823456789
Client IP: 192.168.14.88
UPI Refund Handle: priya@okhdfcbank
Card Verification: 4111 1111 1111 1111
Address: Flat 4B, Green Apartments, Pune`;

export const HR_EXPORT_PRESET = `Employee Onboarding Record (Fictional Sample)
Name: Mr. Amit Patil
Date of Birth: 14/08/1996
Email: amit.patil@enterprise.co.in
Phone: 9765432109
PAN: BCPDE4321K
Aadhaar: 2345 6789 0123
Bank Account Number: 551009872341
Passport: K8765432
PIN Code: 400001`;

export interface PresetDefinition {
  readonly key: PresetKey;
  readonly filename: string;
  readonly fileType: UploadedFileType;
  readonly content: string;
}

export const PRESET_DEFINITIONS: Record<PresetKey, PresetDefinition> = {
  'demo-text': {
    key: 'demo-text',
    filename: 'customer-kyc-profile.txt',
    fileType: 'txt',
    content: DEMO_TEXT_SAMPLE,
  },
  'demo-csv': {
    key: 'demo-csv',
    filename: 'customer-files-sample.csv',
    fileType: 'csv',
    content: DEMO_CSV_SAMPLE,
  },
  'support-log': {
    key: 'support-log',
    filename: 'support-ticket-4821.log',
    fileType: 'txt',
    content: SUPPORT_LOG_PRESET,
  },
  'hr-export': {
    key: 'hr-export',
    filename: 'hr-onboarding-record.txt',
    fileType: 'txt',
    content: HR_EXPORT_PRESET,
  },
};
