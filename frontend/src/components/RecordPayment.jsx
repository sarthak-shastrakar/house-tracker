import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, IndianRupee, Calendar, CreditCard, Loader2 } from 'lucide-react';
import { recordPayment } from '../redux/slices/contractorSlice';
import { toast } from 'react-hot-toast';

const fieldCls =
  'w-full rounded-xl border border-gray-100 bg-gray-50/60 px-3.5 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 transition-all dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-primary-500';

const paymentModes = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'upi', label: 'UPI' },
  { value: 'other', label: 'Other' },
];

const RecordPayment = ({ isOpen, onClose, contractor }) => {
  const dispatch = useDispatch();
  const { paymentLoading } = useSelector((state) => state.contractors);

  const [form, setForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMode: 'cash',
    note: '',
  });
  const [errors, setErrors] = useState({});

  const balanceDue = Math.max(0, (contractor?.contractAmount || 0) - (contractor?.amountPaid || 0));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Enter a valid amount';
    if (!form.paymentDate) errs.paymentDate = 'Payment date is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const result = await dispatch(
      recordPayment({
        contractorId: contractor._id,
        paymentData: {
          amount: Number(form.amount),
          paymentDate: form.paymentDate,
          paymentMode: form.paymentMode,
          note: form.note.trim(),
        },
      })
    );

    if (recordPayment.fulfilled.match(result)) {
      toast.success(`Payment of ₹${Number(form.amount).toLocaleString('en-IN')} recorded!`);
      onClose();
    } else {
      toast.error(result.payload || 'Failed to record payment.');
    }
  };

  if (!isOpen || !contractor) return null;

  const formatRupee = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Record Payment</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              To: <span className="font-semibold text-gray-600 dark:text-gray-300">{contractor.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Balance Info */}
        <div className="mx-6 mt-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3 flex items-center gap-3 text-sm">
          <IndianRupee className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div className="flex-1 flex items-center justify-between">
            <span className="text-amber-700 dark:text-amber-400 text-xs font-medium">Balance Due</span>
            <span className="font-bold text-amber-700 dark:text-amber-300">{formatRupee(balanceDue)}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Amount */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Payment Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              name="amount"
              type="number"
              min="1"
              value={form.amount}
              onChange={handleChange}
              placeholder="Enter amount"
              className={fieldCls}
            />
            {errors.amount && <p className="mt-1 text-xs text-rose-500">{errors.amount}</p>}
          </div>

          {/* Date + Mode */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <Calendar className="inline h-3 w-3 mr-1" />
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                name="paymentDate"
                type="date"
                value={form.paymentDate}
                onChange={handleChange}
                className={fieldCls}
              />
              {errors.paymentDate && <p className="mt-1 text-xs text-rose-500">{errors.paymentDate}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <CreditCard className="inline h-3 w-3 mr-1" />
                Payment Mode
              </label>
              <select
                name="paymentMode"
                value={form.paymentMode}
                onChange={handleChange}
                className={fieldCls}
              >
                {paymentModes.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Note (Optional)
            </label>
            <input
              name="note"
              value={form.note}
              onChange={handleChange}
              placeholder="e.g., 2nd instalment, foundation work"
              className={fieldCls}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={paymentLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-500 disabled:opacity-60 transition-all active:scale-95"
            >
              {paymentLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordPayment;
