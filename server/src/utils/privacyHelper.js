// server/src/utils/privacyHelper.js
// Centralized privacy logic used by sockets and controllers

/**
 * Determine if a viewer can see a target user's specific setting.
 * @param {Object} targetUser Mongoose user document (populated fields)
 * @param {String} viewerUserId ID of the viewer
 * @param {String} settingType One of: 'lastSeen', 'onlineStatus', 'profilePhoto', 'status'
 * @returns {Boolean} true if visible
 */
const canSeePresence = (targetUser, viewerUserId, settingType) => {
  if (!targetUser || !targetUser.privacySettings) return true;
  const setting = targetUser.privacySettings[settingType] || 'Everyone';
  const viewerIdStr = viewerUserId.toString();

  if (setting === 'Everyone') return true;
  if (setting === 'Nobody') return false;

  // Mutual connection: both follow each other
  const followingIds = (targetUser.following || []).map((id) => id.toString());
  const followerIds = (targetUser.followers || []).map((id) => id.toString());
  const isConnection = followingIds.includes(viewerIdStr) && followerIds.includes(viewerIdStr);

  if (setting === 'My Connections') {
    return isConnection;
  }

  if (setting === 'Connections Except...') {
    if (!isConnection) return false;
    const exceptions = (targetUser.privacySettings[`${settingType}Exceptions`] || []).map((id) => id.toString());
    return !exceptions.includes(viewerIdStr);
  }

  if (setting === 'Only Share With...') {
    const onlyShare = (targetUser.privacySettings[`${settingType}OnlyShare`] || []).map((id) => id.toString());
    return onlyShare.includes(viewerIdStr);
  }

  return true;
};

/**
 * Scrub a user object before sending to a viewer based on privacy settings.
 * Replaces hidden profile photos with a default avatar and removes lastSeen if hidden.
 */
const scrubUserVisibility = (targetUser, viewerUserId) => {
  if (!targetUser) return targetUser;
  if (!viewerUserId) return targetUser;

  // If owner is viewing own profile, return as is
  if (targetUser._id && targetUser._id.toString() === viewerUserId.toString()) return targetUser;

  const userObj = targetUser.toObject ? targetUser.toObject() : { ...targetUser };

  // Profile photo privacy
  const canSeePhoto = canSeePresence(targetUser, viewerUserId, 'profilePhoto');
  if (!canSeePhoto) {
    const defaultAvatar = 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg';
    userObj.profilePicture = defaultAvatar;
    userObj.avatar = defaultAvatar;
  }

  // Last seen privacy
  const canSeeLastSeen = canSeePresence(targetUser, viewerUserId, 'lastSeen');
  if (!canSeeLastSeen) {
    delete userObj.lastSeen;
  }

  // Online status privacy
  const canSeeOnline = canSeePresence(targetUser, viewerUserId, 'onlineStatus');
  if (!canSeeOnline) {
    userObj.isOnline = false;
  }

  return userObj;
};

module.exports = { canSeePresence, scrubUserVisibility };
