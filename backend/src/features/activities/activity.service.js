import Activity from './activity.model.js';

export const logActivity = async ({
  ticketId,
  action,
  field = null,
  oldValue = null,
  newValue = null,
  performedBy = 'Support Agent',
  message,
}) => {
  try {
    return await Activity.create({
      ticketId,
      action,
      field,
      oldValue,
      newValue,
      performedBy,
      message,
    });
  } catch (error) {
    console.error(`[Activity Log Error] Failed to log activity for ticket ${ticketId}:`, error.message);
    // Don't crash parent flow if logging encounters non-fatal error
    return null;
  }
};
