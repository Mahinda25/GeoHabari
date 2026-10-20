import React, { useMemo, useState } from 'react';
import {
  Check,
  CreditCard,
  Smartphone,
  Mail,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Loader2,
  Minus,
  Plus,
  CheckCircle2,
  Lock,
  Sparkles,
  GraduationCap,
  UploadCloud,
  FileText,
  RefreshCw,
  X,
  FileCheck2,
} from 'lucide-react';

interface EventTicketType {
  id: string;
  name: string;
  price: number;
  allocation: number;
  sold_count: number;
  description?: string;
}

interface EventData {
  id: string;
  title: string;
  slug: string;
  poster: string;
  description: string;
  venue: string;
  starts_at: string;
  ends_at: string;
  status: string;
  ticket_types: EventTicketType[];
}

interface TicketPurchaseProps {
  event: EventData;
}

const formatCurrency = (value: number) => `KES ${value.toLocaleString()}`;

export default function TicketPurchase({ event }: TicketPurchaseProps) {
  // Find first available ticket type as initial default
  const defaultTicket = useMemo(() => {
    return event.ticket_types.find((t) => (t.allocation - (t.sold_count ?? 0)) > 0) ?? event.ticket_types[0];
  }, [event.ticket_types]);

  const [selectedTypeId, setSelectedTypeId] = useState<string>(defaultTicket?.id ?? '');
  const [quantity, setQuantity] = useState<number>(1);
  const [buyerName, setBuyerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card'>('mpesa');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Student verification states
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'id_card'>('email');
  const [universityEmail, setUniversityEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<
    'unverified' | 'sending_code' | 'code_sent' | 'verifying_code' | 'uploading' | 'approved' | 'failed'
  >('unverified');
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState('');
  const [idFile, setIdFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean; phone?: boolean }>({});

  const selectedType = useMemo(
    () => event.ticket_types.find((ticket) => ticket.id === selectedTypeId) ?? defaultTicket,
    [event.ticket_types, selectedTypeId, defaultTicket]
  );

  const isStudentSelected = useMemo(() => {
    if (!selectedType) return false;
    return selectedType.name.toLowerCase().includes('student') || selectedType.price < 1000;
  }, [selectedType]);

  const remaining = selectedType ? Math.max(0, selectedType.allocation - (selectedType.sold_count ?? 0)) : 0;
  const maxAllowed = Math.min(5, remaining);
  const total = selectedType ? selectedType.price * quantity : 0;

  // Format phone number to national/international format
  const getFullPhoneNumber = (raw: string) => {
    const trimmed = raw.trim().replace(/\s+/g, '');
    if (!trimmed) return '';
    if (trimmed.startsWith('+254')) return trimmed;
    if (trimmed.startsWith('254')) return `+${trimmed}`;
    if (trimmed.startsWith('0')) return `+254${trimmed.slice(1)}`;
    return `+254${trimmed}`;
  };

  const getTicketDescription = (ticket: EventTicketType) => {
    if (ticket.description) return ticket.description;
    const nameLower = ticket.name.toLowerCase();
    if (nameLower.includes('student')) {
      return 'Student admission • Automated .ac.ke email or Student ID check required';
    }
    if (nameLower.includes('professional')) {
      return 'Full summit access • Keynotes, panels & networking (no verification required)';
    }
    return 'General admission • Access to all scheduled sessions';
  };

  const handleSelectTicket = (ticketId: string) => {
    const target = event.ticket_types.find((t) => t.id === ticketId);
    if (!target) return;
    const available = target.allocation - (target.sold_count ?? 0);
    if (available <= 0) return;

    setSelectedTypeId(ticketId);
    setQuantity((prev) => Math.min(Math.max(1, prev), Math.min(5, available)));
    setErrorMessage('');
  };

  const handleQuantityChange = (next: number) => {
    if (next < 1) return;
    if (next > maxAllowed) return;
    setQuantity(next);
  };

  const isEmailValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const isPhoneValid = useMemo(() => {
    const full = getFullPhoneNumber(phone);
    const cleaned = full.replace(/\D/g, '');
    return cleaned.length >= 12; // 254 + 9 digits = 12 digits
  }, [phone]);

  const isStudentVerificationApproved = verificationStatus === 'approved';

  const isFormValid = Boolean(
    selectedType &&
    remaining > 0 &&
    buyerName.trim().length >= 2 &&
    isEmailValid &&
    isPhoneValid &&
    termsAccepted &&
    (!isStudentSelected || isStudentVerificationApproved)
  );

  // ==========================================
  // STUDENT VERIFICATION HANDLERS
  // ==========================================

  const handleSendUniversityCode = async () => {
    setVerificationError('');
    setVerificationSuccess('');

    if (!buyerName.trim()) {
      setVerificationError('Please enter your full buyer name above before requesting a verification code.');
      return;
    }

    const emailTrimmed = universityEmail.trim().toLowerCase();
    if (!emailTrimmed.endsWith('.ac.ke')) {
      setVerificationError('Please enter a valid Kenyan university email ending in .ac.ke (e.g. name@uonbi.ac.ke).');
      return;
    }

    setVerificationStatus('sending_code');

    try {
      const res = await fetch('/api/verify/student-email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailTrimmed,
          buyer_name: buyerName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch university verification code.');
      }

      setVerificationId(data.verification_id);
      setVerificationStatus('code_sent');
      setVerificationSuccess(data.message || 'Verification code sent to your university inbox.');
    } catch (err) {
      setVerificationStatus('unverified');
      setVerificationError(err instanceof Error ? err.message : 'Error sending verification code.');
    }
  };

  const handleVerifyUniversityCode = async () => {
    setVerificationError('');
    setVerificationSuccess('');

    if (!verificationCode.trim() || verificationCode.trim().length !== 6) {
      setVerificationError('Please enter the 6-digit numeric verification code.');
      return;
    }

    setVerificationStatus('verifying_code');

    try {
      const res = await fetch('/api/verify/student-email/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verification_id: verificationId,
          code: verificationCode.trim(),
          buyer_name: buyerName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid or expired verification code.');
      }

      setVerificationStatus('approved');
      setVerificationToken(data.verification_token);
      setVerificationSuccess(data.message || 'University email verified! Student ticket rate unlocked.');
    } catch (err) {
      setVerificationStatus('code_sent');
      setVerificationError(err instanceof Error ? err.message : 'Verification failed.');
    }
  };

  const handleUploadStudentId = async () => {
    setVerificationError('');
    setVerificationSuccess('');

    if (!buyerName.trim()) {
      setVerificationError('Please enter your full buyer name above so our automated system can match the name on your Student ID.');
      return;
    }

    if (!idFile) {
      setVerificationError('Please select a Student ID file (PDF, PNG, JPG, or WEBP up to 5 MB).');
      return;
    }

    setVerificationStatus('uploading');

    try {
      const formData = new FormData();
      formData.append('file', idFile);
      formData.append('buyer_name', buyerName.trim());

      const res = await fetch('/api/verify/student-id/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.status === 'approved') {
        setVerificationStatus('approved');
        setVerificationId(data.verification_id);
        setVerificationToken(data.verification_token);
        setVerificationSuccess(data.message || 'Student ID name match verified! Student ticket rate unlocked.');
      } else {
        setVerificationStatus('failed');
        setVerificationError(data.reason || data.error || 'Could not verify student ID. Please try university email or upload a clearer card.');
      }
    } catch (err) {
      setVerificationStatus('failed');
      setVerificationError(err instanceof Error ? err.message : 'Error uploading Student ID.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVerificationError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setVerificationError('Selected file exceeds the 5 MB maximum limit.');
      return;
    }

    setIdFile(file);
  };

  // ==========================================
  // CHECKOUT SUBMISSION
  // ==========================================

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedType) {
      setErrorMessage('Please choose a ticket type to continue.');
      return;
    }

    if (remaining <= 0) {
      setErrorMessage('The selected ticket category is currently sold out.');
      return;
    }

    if (isStudentSelected && !isStudentVerificationApproved) {
      setErrorMessage('Please complete student verification (.ac.ke email or Student ID) to purchase a Student ticket.');
      return;
    }

    if (!buyerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!isEmailValid) {
      setErrorMessage('Please enter a valid email address for ticket delivery.');
      return;
    }

    const fullPhone = getFullPhoneNumber(phone);
    if (!isPhoneValid) {
      setErrorMessage('Please enter a valid Kenyan phone number (e.g. 712 345 678).');
      return;
    }

    if (!termsAccepted) {
      setErrorMessage('You must agree to the Terms & Conditions and Privacy Policy.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event.id,
          ticket_type_id: selectedType.id,
          quantity,
          buyer_name: buyerName.trim(),
          email: email.trim(),
          phone: fullPhone,
          payment_method: paymentMethod,
          accept_terms: termsAccepted,
          student_verification_id: isStudentSelected ? verificationId : null,
          student_verification_token: isStudentSelected ? verificationToken : null,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Checkout failed. Please verify your details.');
      }

      setSuccessMessage(`Order created! Reference: ${payload.reference}. ${payload.message}`);

      if (payload.redirect) {
        window.location.href = payload.redirect;
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong during checkout.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.08)] overflow-hidden">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-[#1A1A2E] via-[#241B4B] to-[#1A1A2E] px-6 sm:px-8 py-6 text-white border-b border-purple-900/30">
        <div className="flex items-center justify-between gap-3 mb-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#8DC63F]/20 text-[#8DC63F] border border-[#8DC63F]/30">
            <Sparkles className="w-3 h-3" /> Official Checkout
          </span>
          <span className="text-xs text-purple-200/70 font-medium flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-[#8DC63F]" /> 256-bit Secure
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white">
          GET YOUR TICKETS
        </h2>
        <p className="text-slate-300 text-xs sm:text-sm mt-1">
          Choose your ticket category and complete your order details below.
        </p>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        {/* ================= STEP 1: TICKET OPTIONS ================= */}
        <section aria-labelledby="step-ticket-selection" className="space-y-4">
          <div className="flex items-baseline justify-between border-b border-slate-100 pb-2.5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6C2BD9]">Step 1 of 3</span>
              <h3 id="step-ticket-selection" className="text-base sm:text-lg font-bold text-[#1A1A2E] font-display">
                Select Ticket Category
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">1 order = 1 category</span>
          </div>

          <div className="space-y-3.5" role="radiogroup" aria-label="Ticket selection">
            {event.ticket_types.map((ticket) => {
              const available = Math.max(0, ticket.allocation - (ticket.sold_count ?? 0));
              const isSoldOut = available <= 0;
              const isSelected = selectedTypeId === ticket.id;

              return (
                <div
                  key={ticket.id}
                  onClick={() => !isSoldOut && handleSelectTicket(ticket.id)}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={isSoldOut ? -1 : 0}
                  onKeyDown={(e) => {
                    if ((e.key === ' ' || e.key === 'Enter') && !isSoldOut) {
                      e.preventDefault();
                      handleSelectTicket(ticket.id);
                    }
                  }}
                  className={`relative rounded-2xl border-2 transition-all cursor-pointer p-4 sm:p-5 outline-none select-none ${
                    isSoldOut
                      ? 'border-slate-200 bg-slate-50/80 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'border-[#8DC63F] bg-gradient-to-br from-[#8DC63F]/8 via-white to-[#6C2BD9]/5 shadow-sm shadow-[#8DC63F]/20'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: Radio + Title + Desc */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                            isSelected
                              ? 'border-[#8DC63F] bg-[#8DC63F]'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                        </div>
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-bold text-base sm:text-lg text-[#1A1A2E] tracking-tight uppercase">
                            {ticket.name}
                          </span>
                          {isSoldOut ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-red-100 text-red-700 border border-red-200">
                              Sold Out
                            </span>
                          ) : available <= 10 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                              {available} spots left
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Available
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed">
                          {getTicketDescription(ticket)}
                        </p>
                      </div>
                    </div>

                    {/* Right: Price */}
                    <div className="text-right shrink-0">
                      <span className="font-display font-extrabold text-lg sm:text-xl text-[#1A1A2E] block">
                        {formatCurrency(ticket.price)}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">per attendee</span>
                    </div>
                  </div>

                  {/* Integrated Stepper on the Selected Card */}
                  {isSelected && !isSoldOut && (
                    <div className="mt-4 pt-3.5 border-t border-[#8DC63F]/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                          Select Quantity:
                        </span>
                        <span className="text-xs text-slate-400 font-medium">(Max 5)</span>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <div className="inline-flex items-center bg-white border border-slate-200 rounded-xl shadow-inner p-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuantityChange(quantity - 1);
                            }}
                            disabled={quantity <= 1}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition font-bold"
                            aria-label="Decrease ticket quantity"
                          >
                            <Minus className="w-4 h-4" />
                          </button>

                          <span className="min-w-[40px] text-center font-display font-extrabold text-base text-[#1A1A2E]">
                            {quantity}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuantityChange(quantity + 1);
                            }}
                            disabled={quantity >= maxAllowed}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-700 hover:bg-[#8DC63F] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition font-bold"
                            aria-label="Increase ticket quantity"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <span className="text-xs font-bold text-[#6C2BD9]">
                          Subtotal: {formatCurrency(ticket.price * quantity)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= STEP 1.5: AUTOMATED STUDENT VERIFICATION (Only when Student Ticket is selected) ================= */}
        {isStudentSelected && (
          <section
            aria-labelledby="student-verification-heading"
            className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 p-5 space-y-4"
          >
            <div className="flex items-start justify-between gap-3 border-b border-emerald-200/70 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 id="student-verification-heading" className="text-base font-bold text-[#1A1A2E] font-display">
                    Verify Your Student Ticket Eligibility
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Discounted rate: <strong>KES 600</strong> (Standard rate: KES 1,000)
                  </p>
                </div>
              </div>

              {isStudentVerificationApproved ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-sm">
                  <CheckCircle2 className="w-4 h-4" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Verification Required
                </span>
              )}
            </div>

            {/* Explanation Copy */}
            <p className="text-xs text-slate-600 leading-relaxed">
              Use your Kenyan university email ending in <strong>.ac.ke</strong> to receive a single-use verification code. If you cannot access an institutional email, you can upload your Student ID.
              
            </p>

            {/* If Approved, show clear confirmation */}
            {isStudentVerificationApproved ? (
              <div className="p-4 rounded-xl bg-white border border-emerald-300 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <FileCheck2 className="w-6 h-6 text-emerald-600" />
                  <div>
                    <span className="font-bold text-sm text-[#1A1A2E] block">
                      Student Eligibility Unlocked
                    </span>
                    <span className="text-xs text-slate-500">
                      Verified for {buyerName || 'Applicant'}. You can now complete your purchase.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setVerificationStatus('unverified');
                    setVerificationToken('');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 underline font-medium"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Method selector tabs */}
                <div className="flex rounded-xl bg-emerald-100/60 p-1 border border-emerald-200">
                  <button
                    type="button"
                    onClick={() => setVerificationMethod('email')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                      verificationMethod === 'email'
                        ? 'bg-white text-[#1A1A2E] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    1. University Email (.ac.ke) — Preferred
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerificationMethod('id_card')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                      verificationMethod === 'id_card'
                        ? 'bg-white text-[#1A1A2E] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    2. Student ID Upload — Fallback
                  </button>
                </div>

                {/* METHOD 1: UNIVERSITY EMAIL */}
                {verificationMethod === 'email' && (
                  <div className="space-y-3 bg-white p-4 rounded-xl border border-emerald-200 shadow-sm">
                    {verificationStatus !== 'code_sent' && verificationStatus !== 'verifying_code' ? (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Kenyan University Email (.ac.ke)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="email"
                            value={universityEmail}
                            onChange={(e) => setUniversityEmail(e.target.value)}
                            placeholder="e.g. yourname@students.uonbi.ac.ke"
                            className="flex-1 h-11 px-3.5 rounded-xl border border-slate-300 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleSendUniversityCode}
                            disabled={verificationStatus === 'sending_code'}
                            className="px-2 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shrink-0"
                          >
                            {verificationStatus === 'sending_code' ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...
                              </>
                            ) : (
                              'Send Code'
                            )}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Must be an institutional address ending in <strong>.ac.ke</strong>.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-600 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                          <span>
                            Code sent to <strong>{universityEmail}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => setVerificationStatus('unverified')}
                            className="text-emerald-700 underline font-semibold"
                          >
                            Edit Email
                          </button>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Enter 6-Digit Verification Code
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={6}
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                              placeholder="123456"
                              className="flex-1 h-11 px-3.5 rounded-xl border border-slate-300 text-center tracking-[4px] font-bold text-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyUniversityCode}
                              disabled={verificationStatus === 'verifying_code' || verificationCode.length !== 6}
                              className="px-5 py-2 bg-[#6C2BD9] hover:bg-[#5B21B6] disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shrink-0"
                            >
                              {verificationStatus === 'verifying_code' ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking...
                                </>
                              ) : (
                                'Verify Code'
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* METHOD 2: STUDENT ID UPLOAD */}
                {verificationMethod === 'id_card' && (
                  <div className="space-y-3 bg-white p-4 rounded-xl border border-emerald-200 shadow-sm">
                    <div>
                      <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Student ID Document (PDF, PNG, JPG, WEBP - Max 5 MB)
                      </span>
                      <p className="text-xs text-slate-500 mb-2">
                        Upload a clear image or PDF of your Student ID.
                      </p>

                      <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-4 text-center cursor-pointer transition relative bg-slate-50/50">
                        <input
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/webp"
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                          <UploadCloud className="w-7 h-7 text-emerald-600" />
                          <span className="text-xs font-bold text-slate-700">
                            {idFile ? idFile.name : 'Choose file or drag & drop here'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {idFile ? `${(idFile.size / 1024).toFixed(0)} KB` : 'PDF, PNG, JPG or WEBP up to 5 MB'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {idFile && (
                      <button
                        type="button"
                        onClick={handleUploadStudentId}
                        disabled={verificationStatus === 'uploading'}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                      >
                        {verificationStatus === 'uploading' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Running automated name check...
                          </>
                        ) : (
                          'Perform Automated Name Check'
                        )}
                      </button>
                    )}

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                      <strong>Privacy notice:</strong> Uploaded IDs are stored in private encrypted storage solely to verify name consistency for this order and are automatically deleted per our retention policy.
                    </div>
                  </div>
                )}

                {/* Inline verification error/success feedback */}
                {verificationError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>{verificationError}</div>
                  </div>
                )}

                {verificationSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>{verificationSuccess}</div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ================= STEP 2: BUYER DETAILS ================= */}
        <section aria-labelledby="step-buyer-details" className="space-y-4 pt-2">
          <div className="border-b border-slate-100 pb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6C2BD9]">Step 2 of 3</span>
            <h3 id="step-buyer-details" className="text-base sm:text-lg font-bold text-[#1A1A2E] font-display">
              Your Details
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your contact details. Your ticket pass and order confirmation will be sent here.
            </p>
          </div>

          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="buyer-name" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="buyer-name"
                type="text"
                value={buyerName}
                onChange={(e) => {
                  setBuyerName(e.target.value);
                  setErrorMessage('');
                }}
                onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                placeholder="e.g. Jane Wanjiru"
                autoComplete="name"
                className={`w-full h-12 px-4 rounded-xl border bg-slate-50/50 text-[#1A1A2E] placeholder:text-slate-400 text-sm sm:text-base focus:bg-white transition outline-none ${
                  touched.name && !buyerName.trim()
                    ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-slate-200 focus:border-[#8DC63F] focus:ring-3 focus:ring-[#8DC63F]/20'
                }`}
              />
              {touched.name && !buyerName.trim() && (
                <p className="text-[11px] text-red-500 mt-1">Full name is required.</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="buyer-email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address (Ticket Delivery) <span className="text-red-500">*</span>
              </label>
              <input
                id="buyer-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage('');
                }}
                onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                placeholder="jane.wanjiru@example.com"
                autoComplete="email"
                className={`w-full h-12 px-4 rounded-xl border bg-slate-50/50 text-[#1A1A2E] placeholder:text-slate-400 text-sm sm:text-base focus:bg-white transition outline-none ${
                  touched.email && !isEmailValid
                    ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-slate-200 focus:border-[#8DC63F] focus:ring-3 focus:ring-[#8DC63F]/20'
                }`}
              />
              {touched.email && !isEmailValid && (
                <p className="text-[11px] text-red-500 mt-1">Please provide a valid email address.</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="buyer-phone" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Phone Number (M-Pesa STK Push) <span className="text-red-500">*</span>
              </label>
              <div
                className={`flex items-stretch rounded-xl border overflow-hidden bg-slate-50/50 transition ${
                  touched.phone && !isPhoneValid
                    ? 'border-red-300 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100'
                    : 'border-slate-200 focus-within:border-[#8DC63F] focus-within:ring-3 focus-within:ring-[#8DC63F]/20'
                }`}
              >
                <div className="flex items-center gap-1 px-3 sm:px-4 bg-slate-100 border-r border-slate-200 text-slate-700 font-semibold text-xs sm:text-sm select-none shrink-0">
                  <span>+254</span>
                  <span className="text-[10px] text-slate-400">🇰🇪</span>
                </div>
                <input
                  id="buyer-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setErrorMessage('');
                  }}
                  onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
                  placeholder="712 345 678"
                  autoComplete="tel-national"
                  className="flex-1 h-12 px-4 bg-transparent text-[#1A1A2E] placeholder:text-slate-400 text-sm sm:text-base focus:bg-white outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Enter your Kenyan mobile number (e.g. 712 345 678 or 0712 345 678).
              </p>
            </div>

            {/* Delivery Reassurance Note */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 text-xs text-purple-950">
              <Mail className="w-4 h-4 text-[#6C2BD9] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-[#6C2BD9]">Digital Ticket Delivery:</span>
                You’ll receive your tickets and confirmation details by email upon payment confirmation.
              </div>
            </div>
          </div>
        </section>

        {/* ================= STEP 3: PAYMENT METHOD ================= */}
        <section aria-labelledby="step-payment-method" className="space-y-4 pt-2">
          <div className="border-b border-slate-100 pb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6C2BD9]">Step 3 of 3</span>
            <h3 id="step-payment-method" className="text-base sm:text-lg font-bold text-[#1A1A2E] font-display">
              Payment Method
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose your preferred secure payment channel.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Payment method">
            {/* M-Pesa Option */}
            <div
              onClick={() => setPaymentMethod('mpesa')}
              role="radio"
              aria-checked={paymentMethod === 'mpesa'}
              tabIndex={0}
              onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setPaymentMethod('mpesa')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer select-none outline-none ${
                paymentMethod === 'mpesa'
                  ? 'border-[#8DC63F] bg-gradient-to-br from-[#8DC63F]/10 to-white shadow-sm'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'mpesa' ? 'border-[#8DC63F] bg-[#8DC63F]' : 'border-slate-300'
                    }`}
                  >
                    {paymentMethod === 'mpesa' && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  <span className="font-display font-bold text-base text-[#1A1A2E]">M-Pesa</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                  STK Push
                </span>
              </div>
              <p className="text-xs text-slate-500 pl-6">
                Instant prompt to your Safaricom line. Enter PIN on phone.
              </p>
            </div>

            {/* Card Option */}
            <div
              onClick={() => setPaymentMethod('card')}
              role="radio"
              aria-checked={paymentMethod === 'card'}
              tabIndex={0}
              onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setPaymentMethod('card')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer select-none outline-none ${
                paymentMethod === 'card'
                  ? 'border-[#6C2BD9] bg-gradient-to-br from-[#6C2BD9]/10 to-white shadow-sm'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'card' ? 'border-[#6C2BD9] bg-[#6C2BD9]' : 'border-slate-300'
                    }`}
                  >
                    {paymentMethod === 'card' && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <CreditCard className="w-5 h-5 text-[#6C2BD9]" />
                  <span className="font-display font-bold text-base text-[#1A1A2E]">Card</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-800">
                  Visa / MC
                </span>
              </div>
              <p className="text-xs text-slate-500 pl-6">
                Secure debit or credit card checkout verification.
              </p>
            </div>
          </div>

          {/* Contextual instruction card */}
          {paymentMethod === 'mpesa' ? (
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1">
              <div className="flex items-center gap-2 font-semibold text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>M-Pesa STK Push Instructions</span>
              </div>
              <p className="text-slate-600">
                When you click <strong>Pay {formatCurrency(total)}</strong>, Safaricom will send an STK prompt to{' '}
                <strong className="text-slate-900">{getFullPhoneNumber(phone) || '+254 7XX XXX XXX'}</strong>.
              </p>
              <p className="text-[11px] text-emerald-800 font-medium pt-1">
                ⚠️ Enter your M-Pesa PIN only on the official phone popup. Never share your PIN.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-purple-950 space-y-1">
              <div className="flex items-center gap-2 font-semibold text-[#6C2BD9]">
                <ShieldCheck className="w-4 h-4 text-[#6C2BD9] shrink-0" />
                <span>Card Checkout Instructions</span>
              </div>
              <p className="text-slate-600">
                You will proceed through our verified payment processing gateway for 3D-Secure card verification.
              </p>
            </div>
          )}
        </section>

        {/* ================= STEP 4: TERMS CHECKBOX ================= */}
        <div className="pt-2">
          <label className="flex items-start gap-3 cursor-pointer group select-none">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked);
                setErrorMessage('');
              }}
              className="w-5 h-5 mt-0.5 rounded-md border-slate-300 text-[#8DC63F] focus:ring-[#8DC63F] cursor-pointer"
            />
            <span className="text-xs sm:text-sm text-slate-600 leading-normal">
              I agree to the{' '}
              <a
                href="#terms"
                onClick={(e) => {
                  e.preventDefault();
                  alert('GeoHabari Event Terms: Tickets are non-refundable unless the event is canceled by organizers. Tickets can be transferred by contacting support.');
                }}
                className="font-semibold text-[#6C2BD9] hover:underline"
              >
                Terms & Conditions
              </a>{' '}
              and{' '}
              <a
                href="#privacy"
                onClick={(e) => {
                  e.preventDefault();
                  alert('GeoHabari Privacy Policy: We respect your privacy. Contact details and verification files are solely used for ticket delivery and eligibility verification.');
                }}
                className="font-semibold text-[#6C2BD9] hover:underline"
              >
                Privacy Policy
              </a>.
            </span>
          </label>
        </div>

        {/* ================= STEP 5: ORDER SUMMARY ================= */}
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Order Summary
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Event: {event.title}
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>{selectedType?.name || 'General'} Admission</span>
              <span className="font-semibold text-slate-900">{formatCurrency(selectedType?.price ?? 0)}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Quantity</span>
              <span className="font-semibold text-slate-900">× {quantity}</span>
            </div>

            <div className="flex justify-between text-slate-600 pt-1 border-t border-dashed border-slate-200">
              <span>Total Tickets</span>
              <span className="font-bold text-slate-900">{quantity} ticket{quantity > 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-300 flex items-baseline justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Total Due</span>
              <span className="text-[11px] text-slate-400">Inclusive of all event fees</span>
            </div>
            <div className="text-right">
              <span className="font-display font-extrabold text-2xl sm:text-3xl text-[#1A1A2E]">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>

        {/* ================= STEP 6: FEEDBACK & CTA BUTTON ================= */}
        <div className="space-y-3">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Please check your order:</strong>
                {errorMessage}
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Order placed successfully!</strong>
                {successMessage}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={submitting || !isFormValid}
            className="w-full min-h-[54px] px-6 py-4 rounded-xl font-display font-bold text-base sm:text-lg text-white shadow-xl shadow-purple-950/10 transition-all flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-[#6C2BD9] via-[#783FC6] to-[#8DC63F] hover:from-[#5B21B6] hover:to-[#7CB334] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>
                  {paymentMethod === 'mpesa' ? 'Initiating M-Pesa STK Push...' : 'Processing payment...'}
                </span>
              </>
            ) : (
              <>
                <span>Pay {formatCurrency(total)}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {!isFormValid && (
            <p className="text-center text-[11px] text-slate-400">
              {isStudentSelected && !isStudentVerificationApproved
                ? 'Student verification (.ac.ke email or Student ID) is required before payment.'
                : 'Complete your name, valid email, phone, and accept terms to activate payment.'}
            </p>
          )}

          <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" /> Authorized Daraja / M-Pesa
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-500" /> PCI-DSS Compliant
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
