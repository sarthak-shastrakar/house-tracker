const PlaceholderPage = ({ title }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
        {title}
      </h1>
      <p className="text-gray-500 dark:text-gray-400">
        This page is coming soon.
      </p>
    </div>
  </div>
);

// Dashboard is now in its own page component file.
// Materials is now implemented as a real page.
export const Contractors = () => <PlaceholderPage title="Contractors" />;
export const ContractorDetail = () => <PlaceholderPage title="Contractor Detail" />;
export const Bills = () => <PlaceholderPage title="Bills" />;
export const Analytics = () => <PlaceholderPage title="Analytics" />;
export const AuditLog = () => <PlaceholderPage title="Audit Log" />;
export const Settings = () => <PlaceholderPage title="Settings" />;
