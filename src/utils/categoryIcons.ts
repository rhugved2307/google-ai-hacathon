import {
  Building2,
  Calendar,
  CreditCard,
  Fingerprint,
  Globe,
  Hash,
  IdCard,
  Landmark,
  Link2,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  User,
  Wallet,
} from 'lucide-react';
import type { PIICategory } from '../engine/types';

export function getCategoryIcon(category: PIICategory) {
  switch (category) {
    case 'EMAIL':
      return Mail;
    case 'PHONE':
      return Phone;
    case 'AADHAAR':
      return Fingerprint;
    case 'PAN':
      return IdCard;
    case 'CARD':
      return CreditCard;
    case 'UPI':
      return Wallet;
    case 'IP_ADDRESS':
      return Globe;
    case 'URL':
      return Link2;
    case 'DOB':
      return Calendar;
    case 'PERSON':
      return User;
    case 'ADDRESS':
      return MapPin;
    case 'PASSPORT':
      return Building2;
    case 'BANK_ACCOUNT':
      return Landmark;
    case 'PIN_CODE':
      return Hash;
    case 'CUSTOM':
    default:
      return Sparkles;
  }
}
