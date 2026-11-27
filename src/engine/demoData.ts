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
