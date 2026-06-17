const ActivityLog = require('../models/ActivityLog');

/**
 * Utility to log an action to the ActivityLog collection.
 * 
 * @param {string|ObjectId} userId - ID of the user performing the action
 * @param {'created'|'updated'|'deleted'|'uploaded'} action - The type of action
 * @param {'project'|'material'|'contractor'|'bill'|'payment'} module - Target module
 * @param {string|ObjectId} recordId - ObjectId of the created/modified record
 * @param {string} description - Brief summary of the change
 * @param {any} [oldValue] - Previous state of modified attributes
 * @param {any} [newValue] - Next state of modified attributes
 */
const logActivity = async (
  userId,
  action,
  module,
  recordId,
  description,
  oldValue = null,
  newValue = null
) => {
  try {
    const logEntry = new ActivityLog({
      userId,
      action,
      module,
      recordId,
      description,
      oldValue,
      newValue,
    });
    await logEntry.save();
  } catch (error) {
    // Fail silently in production, log in dev to prevent blocking controllers
    console.error('Failed to log activity audit entry:', error);
  }
};

module.exports = { logActivity };
