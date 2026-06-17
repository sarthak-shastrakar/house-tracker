import { useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  X,
  Upload,
  FileText,
  Image,
  AlertCircle,
  Loader2,
  CheckCircle2,
  CloudUpload,
  IndianRupee,
  Calendar,
  Tag,
  Building2,
} from 'lucide-react';
import { uploadBill, setUploadProgress } from '../redux/slices/billSlice';
import { toast } from 'react-hot-toast';

const BILL_TYPES = [
  { value: 'material_invoice', label: 'Material Invoice' },
  { value: 'contractor_bill', label: 'Contractor Bill' },
  { value: 'labour_bill', label: 'Labour Bill' },
  { value: 'utility_bill', label: 'Utility Bill' },
  { value: 'permit_fee', label: 'Permit Fee' },
  { value: 'miscellaneous', label: 'Miscellaneous' },
];

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

const fieldCls =
  'w-full rounded-xl border border-gray-100 bg-gray-50/60 px-3.5 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 transition-all dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-primary-500';

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const UploadBill = ({ isOpen, onClose, preselectedProjectId = '' }) => {
  const dispatch = useDispatch();
  const { projects } = useSelector((state) => state.projects);
  const { uploading, uploadProgress } = useSelector((state) => state.bills);

  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);

  const [form, setForm] = useState({
    title: '',
    project: preselectedProjectId || '',
    billType: 'material_invoice',
    amount: '',
    billDate: new Date().toISOString().slice(0, 10),
    vendorName: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  const validateFile = (f) => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      return 'Invalid file type. Only JPG, PNG, WEBP, and PDF files are allowed.';
    }
    if (f.size > MAX_SIZE) {
      return `File too large. Maximum size is 10 MB (your file: ${formatBytes(f.size)}).`;
    }
    return '';
  };

  const processFile = (f) => {
    const err = validateFile(f);
    if (err) {
      setFileError(err);
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    setFileError('');
    setFile(f);
    // Generate preview for images
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
    // Auto-fill title from filename if empty
    if (!form.title) {
      const name = f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      setForm((prev) => ({ ...prev, title: name }));
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) processFile(dropped);
  }, [form.title]);

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) processFile(f);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!file) errs.file = 'Please select a file to upload';
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.project) errs.project = 'Please select a project';
    if (!form.billType) errs.billType = 'Bill type is required';
    if (!form.billDate) errs.billDate = 'Bill date is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', form.title.trim());
    formData.append('project', form.project);
    formData.append('billType', form.billType);
    formData.append('billDate', form.billDate);
    if (form.amount) formData.append('amount', form.amount);
    if (form.vendorName) formData.append('vendorName', form.vendorName.trim());
    if (form.notes) formData.append('notes', form.notes.trim());

    const toastId = toast.loading('Uploading bill...');

    const result = await dispatch(
      uploadBill({
        formData,
        onProgress: (pct) => dispatch(setUploadProgress(pct)),
      })
    );

    if (uploadBill.fulfilled.match(result)) {
      toast.success('Bill uploaded successfully!', { id: toastId });
      onClose();
    } else {
      toast.error(result.payload || 'Upload failed.', { id: toastId });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-950/65 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl max-h-[94vh] overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-950/40">
              <CloudUpload className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Upload Bill</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">JPG, PNG, WEBP or PDF · Max 10 MB</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* ── File Drop Zone ── */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              File <span className="text-rose-500">*</span>
            </label>

            {!file ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all ${
                  dragOver
                    ? 'border-primary-400 bg-primary-50 dark:border-primary-500 dark:bg-primary-950/20'
                    : 'border-gray-200 bg-gray-50/40 hover:border-primary-300 hover:bg-primary-50/30 dark:border-gray-800 dark:bg-gray-900/30 dark:hover:border-primary-700'
                }`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${dragOver ? 'bg-primary-100 dark:bg-primary-900/50' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Upload className={`h-6 w-6 ${dragOver ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {dragOver ? 'Drop file here' : 'Drag & drop or click to browse'}
                  </p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    JPG, PNG, WEBP, PDF — up to 10 MB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              /* File Preview */
              <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="preview"
                    className="h-16 w-16 flex-shrink-0 rounded-lg object-cover border border-gray-100 dark:border-gray-800"
                  />
                ) : (
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30">
                    <FileText className="h-8 w-8 text-red-500 dark:text-red-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{file.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {formatBytes(file.size)} · {file.type.includes('pdf') ? 'PDF' : 'Image'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setFile(null); setPreviewUrl(null); }}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {fileError && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-500">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {fileError}
              </div>
            )}
            {errors.file && !fileError && (
              <p className="mt-1 text-xs text-rose-500">{errors.file}</p>
            )}
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Uploading to cloud...</span>
                <span className="font-bold text-primary-600 dark:text-primary-400">{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-primary-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <Tag className="inline h-3 w-3 mr-1" />
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Cement Invoice — June 2025"
              className={fieldCls}
            />
            {errors.title && <p className="mt-1 text-xs text-rose-500">{errors.title}</p>}
          </div>

          {/* Project + Bill Type */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <Building2 className="inline h-3 w-3 mr-1" />
                Project <span className="text-rose-500">*</span>
              </label>
              <select
                name="project"
                value={form.project}
                onChange={handleChange}
                className={fieldCls}
              >
                <option value="">— Select Project —</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
              {errors.project && <p className="mt-1 text-xs text-rose-500">{errors.project}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Bill Type <span className="text-rose-500">*</span>
              </label>
              <select
                name="billType"
                value={form.billType}
                onChange={handleChange}
                className={fieldCls}
              >
                {BILL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {errors.billType && <p className="mt-1 text-xs text-rose-500">{errors.billType}</p>}
            </div>
          </div>

          {/* Amount + Date */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <IndianRupee className="inline h-3 w-3 mr-1" />
                Amount (₹) — Optional
              </label>
              <input
                name="amount"
                type="number"
                min="0"
                value={form.amount}
                onChange={handleChange}
                placeholder="Enter bill amount"
                className={fieldCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <Calendar className="inline h-3 w-3 mr-1" />
                Bill Date <span className="text-rose-500">*</span>
              </label>
              <input
                name="billDate"
                type="date"
                value={form.billDate}
                onChange={handleChange}
                className={fieldCls}
              />
              {errors.billDate && <p className="mt-1 text-xs text-rose-500">{errors.billDate}</p>}
            </div>
          </div>

          {/* Vendor */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Vendor / Supplier Name — Optional
            </label>
            <input
              name="vendorName"
              value={form.vendorName}
              onChange={handleChange}
              placeholder="e.g. Sharma Trading Co."
              className={fieldCls}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Notes — Optional
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Additional remarks..."
              className={`${fieldCls} resize-none`}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="rounded-xl border border-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-500/20 hover:bg-primary-500 disabled:opacity-60 transition-all active:scale-95"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading {uploadProgress}%
                </>
              ) : (
                <>
                  <CloudUpload className="h-4 w-4" />
                  Upload Bill
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadBill;
