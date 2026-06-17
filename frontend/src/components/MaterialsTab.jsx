import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Trash2, Edit, Package, BarChart2, TrendingUp, Layers } from 'lucide-react';
import { fetchMaterials, deleteMaterial, fetchMaterialSummary } from '../redux/slices/materialSlice';
import { fetchProjectById } from '../redux/slices/projectSlice';
import AddEditMaterial from './AddEditMaterial';
import { toast } from 'react-hot-toast';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { useTheme } from '../context/ThemeContext';

// Helper to format currency in Indian format
const formatRupee = (num) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

// Helper to format dates
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const MaterialsTab = ({ projectId }) => {
  const dispatch = useDispatch();
  const { isDark } = useTheme();
  
  const { materials, summary, loading } = useSelector((state) => state.materials);

  // Modal control states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch materials list & summary on mount or change
  const loadData = () => {
    dispatch(fetchMaterials({ projectId }));
    dispatch(fetchMaterialSummary(projectId));
  };

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [dispatch, projectId]);

  const handleDelete = async (id) => {
    try {
      const actionResult = await dispatch(deleteMaterial(id));
      if (deleteMaterial.fulfilled.match(actionResult)) {
        toast.success('Material record deleted.');
        setDeletingId(null);
        // Reload tab details
        loadData();
        // Reload project main detail stats (like spent amount)
        dispatch(fetchProjectById(projectId));
      } else {
        toast.error(actionResult.payload || 'Failed to delete record.');
      }
    } catch {
      toast.error('An unexpected error occurred.');
    }
  };

  const materialTypeLabels = {
    cement: 'Cement',
    sand: 'Sand',
    steel: 'Steel',
    brick: 'Bricks',
    paint: 'Paint',
    wood: 'Wood',
    tiles: 'Tiles',
    electrical: 'Electrical',
    plumbing: 'Plumbing',
    custom: 'Custom',
  };

  // Recharts Chart breakdown formatting
  const chartData = summary?.breakdown?.map((item) => ({
    name: item.type === 'custom' ? 'Custom' : materialTypeLabels[item.type] || item.type,
    Amount: item.totalAmount,
  })) || [];

  // Colors list for chart columns
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#6366f1', '#14b8a6', '#f43f5e', '#a855f7'];

  return (
    <div className="space-y-6">
      {/* Action Header bar */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
        <div>
          <h3 className="text-base font-bold text-gray-950 dark:text-white">Material Expenses Ledger</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Summary of raw materials purchased</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-655 bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-primary-500 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Log Purchase
        </button>
      </div>

      {/* Analytics Summary Row */}
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/60">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Material Cost</span>
            <p className="text-lg font-bold text-gray-950 dark:text-white">
              {formatRupee(summary?.totalSpent || 0)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/60">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Log Entries</span>
            <p className="text-lg font-bold text-gray-950 dark:text-white">
              {summary?.totalEntries || 0}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/60">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Main Expense</span>
            <p className="text-lg font-bold text-gray-955 capitalize dark:text-white">
              {summary?.mostExpensiveType === 'N/A' ? '-' : summary?.mostExpensiveType}
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Chart and List Table */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart Column */}
        {chartData.length > 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/60 flex flex-col">
            <div className="mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <BarChart2 className="h-4 w-4" /> Cost Allocation
              </h4>
            </div>
            <div className="h-60 w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f1f5f9'} vertical={false} />
                  <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#090d16' : '#ffffff',
                      borderColor: isDark ? '#1e293b' : '#e2e8f0',
                      borderRadius: '10px',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      fontSize: '11px',
                    }}
                    formatter={(v) => [formatRupee(v), 'Amount']}
                  />
                  <Bar dataKey="Amount" radius={[4, 4, 0, 0]} maxBarSize={25}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Table list column */}
        <div className={`rounded-2xl border border-gray-100 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900/60 overflow-hidden ${chartData.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {materials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-8 w-8 text-gray-300 dark:text-gray-750 mb-2" />
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-350">No purchases recorded</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Click the log button to add first entry.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold uppercase tracking-wider text-gray-405 dark:border-gray-800 dark:bg-gray-950/40">
                  <tr>
                    <th className="px-5 py-3.5">Material</th>
                    <th className="px-5 py-3.5">Quantity</th>
                    <th className="px-5 py-3.5">Rate</th>
                    <th className="px-5 py-3.5">Total</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Vendor</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150/40 dark:divide-gray-800/40">
                  {materials.map((item) => {
                    const typeLabel = item.materialType === 'custom' ? item.customMaterialName : materialTypeLabels[item.materialType] || item.materialType;
                    const formattedUnit = item.unit === 'custom' ? item.customUnit : item.unit;
                    
                    return (
                      <tr key={item._id} className="hover:bg-gray-50/20 dark:hover:bg-gray-900/10">
                        <td className="px-5 py-3.5 font-bold text-gray-900 dark:text-white capitalize">
                          {typeLabel}
                        </td>
                        <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300">
                          {item.quantity} <span className="text-[10px] text-gray-400 capitalize">{formattedUnit}</span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-655 dark:text-gray-400">
                          {formatRupee(item.rate)}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-gray-900 dark:text-white">
                          {formatRupee(item.totalAmount)}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-450">
                          {formatDate(item.purchaseDate)}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-450 truncate max-w-[100px]">
                          {item.vendorName || '-'}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingMaterial(item)}
                              className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-900"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingId(item._id)}
                              className="rounded-lg p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-450"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modals */}
      {showAddModal && (
        <AddEditMaterial
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            loadData();
            // Refresh parent page metrics
            dispatch(fetchProjectById(projectId));
          }}
          defaultProjectId={projectId}
        />
      )}

      {editingMaterial && (
        <AddEditMaterial
          isOpen={!!editingMaterial}
          onClose={() => {
            setEditingMaterial(null);
            loadData();
            dispatch(fetchProjectById(projectId));
          }}
          purchase={editingMaterial}
          defaultProjectId={projectId}
        />
      )}

      {/* Delete confirmation modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs" onClick={() => setDeletingId(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-950">
            <h3 className="text-sm font-bold text-gray-950 dark:text-white">Delete Log Entry?</h3>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              Confirm deleting this material purchase log. The spent total will be updated immediately.
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <button
                onClick={() => setDeletingId(null)}
                className="rounded-xl border border-gray-100 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/60"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="rounded-xl bg-rose-600 px-4.5 py-2 text-xs font-semibold text-white hover:bg-rose-500 shadow-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialsTab;
