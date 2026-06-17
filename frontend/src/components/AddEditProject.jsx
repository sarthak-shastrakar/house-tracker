import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createProject, updateProject } from '../redux/slices/projectSlice';

// Helper to convert date object/string to YYYY-MM-DD for input value
const formatDateString = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};

const AddEditProject = ({ isOpen, onClose, project = null }) => {
  const dispatch = useDispatch();
  const isEditMode = !!project;

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    landArea: '',
    constructionArea: '',
    totalBudget: '',
    status: 'active',
    startDate: '',
    expectedEndDate: '',
    budgetWarningThreshold: 80,
    budgetNote: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill state if editing
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        location: project.location || '',
        landArea: project.landArea || '',
        constructionArea: project.constructionArea || '',
        totalBudget: project.totalBudget || '',
        status: project.status || 'active',
        startDate: formatDateString(project.startDate),
        expectedEndDate: formatDateString(project.expectedEndDate),
        budgetWarningThreshold: project.budgetWarningThreshold || 80,
        budgetNote: '', // Initialize note for budget changes
      });
    } else {
      setFormData({
        name: '',
        description: '',
        location: '',
        landArea: '',
        constructionArea: '',
        totalBudget: '',
        status: 'active',
        startDate: '',
        expectedEndDate: '',
        budgetWarningThreshold: 80,
        budgetNote: '',
      });
    }
    setFormErrors({});
  }, [project, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear validation error when typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Project name is required.';
    if (!formData.location.trim()) errors.location = 'Project location is required.';
    if (!formData.totalBudget) {
      errors.totalBudget = 'Total budget is required.';
    } else if (Number(formData.totalBudget) < 0) {
      errors.totalBudget = 'Budget cannot be negative.';
    }

    if (formData.landArea && Number(formData.landArea) < 0) {
      errors.landArea = 'Land area cannot be negative.';
    }

    if (formData.constructionArea && Number(formData.constructionArea) < 0) {
      errors.constructionArea = 'Construction area cannot be negative.';
    }

    if (formData.budgetWarningThreshold < 1 || formData.budgetWarningThreshold > 100) {
      errors.budgetWarningThreshold = 'Threshold must be between 1% and 100%.';
    }

    // Date logic verification
    if (formData.startDate && formData.expectedEndDate) {
      if (new Date(formData.startDate) > new Date(formData.expectedEndDate)) {
        errors.expectedEndDate = 'Expected end date must be after start date.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    
    // Formatting data properties
    const submitData = {
      ...formData,
      landArea: formData.landArea ? Number(formData.landArea) : 0,
      constructionArea: formData.constructionArea ? Number(formData.constructionArea) : 0,
      totalBudget: Number(formData.totalBudget),
      budgetWarningThreshold: Number(formData.budgetWarningThreshold),
      startDate: formData.startDate ? new Date(formData.startDate) : null,
      expectedEndDate: formData.expectedEndDate ? new Date(formData.expectedEndDate) : null,
    };

    try {
      if (isEditMode) {
        // Edit Action
        const resultAction = await dispatch(
          updateProject({ id: project._id, data: submitData })
        );
        if (updateProject.fulfilled.match(resultAction)) {
          toast.success('Project updated successfully.');
          onClose();
        } else {
          toast.error(resultAction.payload || 'Failed to update project.');
        }
      } else {
        // Add Action
        const resultAction = await dispatch(createProject(submitData));
        if (createProject.fulfilled.match(resultAction)) {
          toast.success('Project created successfully.');
          onClose();
        } else {
          toast.error(resultAction.payload || 'Failed to create project.');
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-2xl transform overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl transition-all dark:border-gray-800 dark:bg-gray-950 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4.5 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {isEditMode ? 'Edit Project Details' : 'Initialize New Project'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-900 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* Row 1: Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Project Name *
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Skyline Towers Phase 1"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full rounded-xl border py-2.5 px-3.5 text-sm outline-hidden focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 dark:bg-gray-900 ${
                formErrors.name
                  ? 'border-rose-300 focus:border-rose-500 dark:border-rose-900/50'
                  : 'border-gray-100 dark:border-gray-800'
              }`}
            />
            {formErrors.name && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-semibold">{formErrors.name}</p>
            )}
          </div>

          {/* Row 2: Location */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Location *
            </label>
            <input
              type="text"
              name="location"
              placeholder="e.g. Sector 62, Noida, UP"
              value={formData.location}
              onChange={handleInputChange}
              className={`w-full rounded-xl border py-2.5 px-3.5 text-sm outline-hidden focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 dark:bg-gray-900 ${
                formErrors.location
                  ? 'border-rose-300 focus:border-rose-500 dark:border-rose-900/50'
                  : 'border-gray-100 dark:border-gray-800'
              }`}
            />
            {formErrors.location && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-semibold">{formErrors.location}</p>
            )}
          </div>

          {/* Row 3: Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Brief summary regarding the project details..."
              value={formData.description}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-gray-100 py-2.5 px-3.5 text-sm outline-hidden focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 dark:border-gray-800 dark:bg-gray-900"
            />
          </div>

          {/* Row 4: Land Area & Construction Area */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Land Area (Sq Ft)
              </label>
              <input
                type="number"
                name="landArea"
                placeholder="e.g. 5000"
                value={formData.landArea}
                onChange={handleInputChange}
                className={`w-full rounded-xl border py-2.5 px-3.5 text-sm outline-hidden focus:border-primary-500 dark:bg-gray-900 ${
                  formErrors.landArea ? 'border-rose-300 dark:border-rose-900/50' : 'border-gray-100 dark:border-gray-800'
                }`}
              />
              {formErrors.landArea && (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{formErrors.landArea}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Construction Area (Sq Ft)
              </label>
              <input
                type="number"
                name="constructionArea"
                placeholder="e.g. 3800"
                value={formData.constructionArea}
                onChange={handleInputChange}
                className={`w-full rounded-xl border py-2.5 px-3.5 text-sm outline-hidden focus:border-primary-500 dark:bg-gray-900 ${
                  formErrors.constructionArea ? 'border-rose-300 dark:border-rose-900/50' : 'border-gray-100 dark:border-gray-800'
                }`}
              />
              {formErrors.constructionArea && (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{formErrors.constructionArea}</p>
              )}
            </div>
          </div>

          {/* Row 5: Total Budget & Warning Threshold */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Total Budget (₹) *
              </label>
              <input
                type="number"
                name="totalBudget"
                placeholder="e.g. 2500000"
                value={formData.totalBudget}
                onChange={handleInputChange}
                className={`w-full rounded-xl border py-2.5 px-3.5 text-sm outline-hidden focus:border-primary-500 dark:bg-gray-900 ${
                  formErrors.totalBudget
                    ? 'border-rose-300 focus:border-rose-500 dark:border-rose-900/50'
                    : 'border-gray-100 dark:border-gray-800'
                }`}
              />
              {formErrors.totalBudget && (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-semibold">{formErrors.totalBudget}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Warning Threshold (%) *
              </label>
              <input
                type="number"
                name="budgetWarningThreshold"
                min="1"
                max="100"
                value={formData.budgetWarningThreshold}
                onChange={handleInputChange}
                className={`w-full rounded-xl border py-2.5 px-3.5 text-sm outline-hidden focus:border-primary-500 dark:bg-gray-900 ${
                  formErrors.budgetWarningThreshold
                    ? 'border-rose-300 dark:border-rose-900/50'
                    : 'border-gray-100 dark:border-gray-800'
                }`}
              />
              {formErrors.budgetWarningThreshold && (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{formErrors.budgetWarningThreshold}</p>
              )}
            </div>
          </div>

          {/* Row 5b: Budget Modification Note (Edit Mode Only if Budget changes) */}
          {isEditMode && Number(formData.totalBudget) !== project.totalBudget && (
            <div className="animate-slide-down">
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1.5">
                Budget Change Note *
              </label>
              <input
                type="text"
                name="budgetNote"
                placeholder="Reason for changing the budget (e.g. Scope extension, material cost increase)"
                value={formData.budgetNote}
                onChange={handleInputChange}
                required
                className="w-full rounded-xl border border-amber-200 py-2.5 px-3.5 text-sm outline-hidden focus:border-amber-500 dark:border-amber-900/50 dark:bg-gray-900"
              />
            </div>
          )}

          {/* Row 6: Status & Start Date */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-100 py-2.5 px-3.5 text-sm outline-hidden focus:border-primary-500 dark:border-gray-800 dark:bg-gray-900"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-100 py-2.5 px-3.5 text-sm outline-hidden focus:border-primary-500 dark:border-gray-800 dark:bg-gray-900"
              />
            </div>
          </div>

          {/* Row 7: Expected End Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Expected End Date
            </label>
            <input
              type="date"
              name="expectedEndDate"
              value={formData.expectedEndDate}
              onChange={handleInputChange}
              className={`w-full rounded-xl border py-2.5 px-3.5 text-sm outline-hidden focus:border-primary-500 dark:bg-gray-900 ${
                formErrors.expectedEndDate ? 'border-rose-300 dark:border-rose-900/50' : 'border-gray-100 dark:border-gray-800'
              }`}
            />
            {formErrors.expectedEndDate && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-semibold">{formErrors.expectedEndDate}</p>
            )}
          </div>

          {/* Modal Footer actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-450 dark:hover:bg-gray-900/60 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 shadow-md shadow-primary-500/25 transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditProject;
