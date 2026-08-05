import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaKey, FaEnvelope, FaShieldAlt, FaIdBadge, FaExchangeAlt, FaBriefcase, FaFileDownload, FaTrash, FaLock, FaUser } from 'react-icons/fa';
import { NestedPanelHeader, SettingAction, SettingToggle } from './SettingsPanels';

export const AccountPanel = ({ onBack }) => {
  const [activeSubModal, setActiveSubModal] = useState(null);

  const renderSubModal = () => {
    switch(activeSubModal) {
      case 'passkeys': return <PasskeysPanel onBack={() => setActiveSubModal(null)} />;
      case 'email': return <EmailPanel onBack={() => setActiveSubModal(null)} />;
      case 'twostep': return <TwoStepPanel onBack={() => setActiveSubModal(null)} />;
      case 'security': return <SecurityPanel onBack={() => setActiveSubModal(null)} />;
      case 'username': return <UserNamePanel onBack={() => setActiveSubModal(null)} />;
      case 'business': return <BusinessPlatformPanel onBack={() => setActiveSubModal(null)} />;
      case 'changeEmail': return <ChangeEmailPanel onBack={() => setActiveSubModal(null)} />;
      case 'requestInfo': return <RequestAccountInfoPanel onBack={() => setActiveSubModal(null)} />;
      case 'delete': return <DeleteAccountPanel onBack={() => setActiveSubModal(null)} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21] z-40 absolute inset-0">
      <NestedPanelHeader title="Account" onBack={onBack} />
      <div className="flex-1 overflow-y-auto">
        <SettingAction icon={<FaKey />} title="Passkeys" onClick={() => setActiveSubModal('passkeys')} />
        <SettingAction icon={<FaEnvelope />} title="Email address" onClick={() => setActiveSubModal('email')} />
        <SettingAction icon={<FaShieldAlt />} title="Two-step verification" onClick={() => setActiveSubModal('twostep')} />
        <SettingAction icon={<FaShieldAlt />} title="Security notifications" onClick={() => setActiveSubModal('security')} />
        <SettingAction icon={<FaIdBadge />} title="User name" onClick={() => setActiveSubModal('username')} />
        <SettingAction icon={<FaBriefcase />} title="Business platform" onClick={() => setActiveSubModal('business')} />
        <SettingAction icon={<FaExchangeAlt />} title="Change email" onClick={() => setActiveSubModal('changeEmail')} />
        <SettingAction icon={<FaFileDownload />} title="Request account info" onClick={() => setActiveSubModal('requestInfo')} />
        <SettingAction icon={<FaTrash />} title="Delete account" onClick={() => setActiveSubModal('delete')} textColor="text-red-500" />
      </div>

      <AnimatePresence>
        {activeSubModal && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="absolute inset-0 z-50">
            {renderSubModal()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PasskeysPanel = ({ onBack }) => (
  <div className="flex flex-col h-full bg-white dark:bg-[#111b21]">
    <NestedPanelHeader title="Passkeys" onBack={onBack} />
    <div className="p-6 text-center">
      <FaKey className="text-yellow-500 w-16 h-16 mx-auto mb-4" />
      <h3 className="text-xl font-bold dark:text-white">A simple way to sign in safely</h3>
      <p className="text-gray-500 text-sm mt-2">
        You can use your fingerprint, face, or screen lock to verify if it's you with a passkey.
      </p>
      <button className="w-full py-3 bg-green-500 text-white font-bold rounded-xl mt-6">Create a passkey</button>
    </div>
  </div>
);

const EmailPanel = ({ onBack }) => (
  <div className="flex flex-col h-full bg-white dark:bg-[#111b21]">
    <NestedPanelHeader title="Email address" onBack={onBack} />
    <div className="p-6">
      <p className="text-sm text-gray-500 mb-4">Email helps you access your account. It isn't visible to others.</p>
      <input type="email" placeholder="Email address" className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-xl outline-none text-gray-900 dark:text-gray-100" />
      <button className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl mt-4">Save</button>
    </div>
  </div>
);

const TwoStepPanel = ({ onBack }) => (
  <div className="flex flex-col h-full bg-white dark:bg-[#111b21]">
    <NestedPanelHeader title="Two-step verification" onBack={onBack} />
    <div className="p-6 text-center">
      <FaShieldAlt className="text-blue-500 w-16 h-16 mx-auto mb-4" />
      <h3 className="text-xl font-bold dark:text-white">Extra security</h3>
      <p className="text-gray-500 text-sm mt-2">
        For extra security, turn on two-step verification, which will require a PIN when registering your account with SkillLinked again.
      </p>
      <button className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl mt-6">Turn on</button>
    </div>
  </div>
);

const SecurityPanel = ({ onBack }) => {
  const [notifs, setNotifs] = useState(true);
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21]">
      <NestedPanelHeader title="Security notifications" onBack={onBack} />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 text-center border-b border-gray-100 dark:border-gray-800">
          <FaLock className="text-green-500 w-12 h-12 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">
            Your chats and calls are private. End-to-end encryption keeps your personal messages and calls between you and the people you choose.
          </p>
        </div>
        <SettingToggle title="Show security notifications on this device" subtitle="Get notified when your security code changes for a contact's phone." value={notifs} onChange={setNotifs} />
      </div>
    </div>
  );
};

const UserNamePanel = ({ onBack }) => (
  <div className="flex flex-col h-full bg-white dark:bg-[#111b21]">
    <NestedPanelHeader title="User name" onBack={onBack} />
    <div className="p-6">
      <p className="text-sm text-gray-500 mb-4">Choose a unique username so people can find you easily.</p>
      <input type="text" placeholder="@username" className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-xl outline-none text-gray-900 dark:text-gray-100" />
      <button className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl mt-4">Save Username</button>
    </div>
  </div>
);

const BusinessPlatformPanel = ({ onBack }) => (
  <div className="flex flex-col h-full bg-white dark:bg-[#111b21]">
    <NestedPanelHeader title="Business platform" onBack={onBack} />
    <div className="p-6 text-center">
      <FaBriefcase className="text-blue-500 w-16 h-16 mx-auto mb-4" />
      <h3 className="text-xl font-bold dark:text-white">Upgrade to Business</h3>
      <p className="text-gray-500 text-sm mt-2">
        Unlock premium business features like catalogs, automated replies, and business analytics.
      </p>
      <button className="w-full py-3 bg-green-500 text-white font-bold rounded-xl mt-6">Get Started</button>
    </div>
  </div>
);

const ChangeEmailPanel = ({ onBack }) => (
  <div className="flex flex-col h-full bg-white dark:bg-[#111b21]">
    <NestedPanelHeader title="Change email" onBack={onBack} />
    <div className="p-6 text-center">
      <FaExchangeAlt className="text-blue-500 w-16 h-16 mx-auto mb-4" />
      <h3 className="text-xl font-bold dark:text-white">Change Email Address</h3>
      <p className="text-gray-500 text-sm mt-2 mb-6">
        Changing your email will migrate your account info, groups, and settings to the new email address.
      </p>
      <button className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl">Next</button>
    </div>
  </div>
);

const RequestAccountInfoPanel = ({ onBack }) => (
  <div className="flex flex-col h-full bg-white dark:bg-[#111b21]">
    <NestedPanelHeader title="Request account info" onBack={onBack} />
    <div className="p-6 text-center">
      <FaFileDownload className="text-purple-500 w-16 h-16 mx-auto mb-4" />
      <h3 className="text-xl font-bold dark:text-white">Request Info</h3>
      <p className="text-gray-500 text-sm mt-2 mb-6 text-left">
        Create a report of your account information and settings, which you can access or port to another app. This report does not include your messages.
      </p>
      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700">
        <FaFileDownload className="text-gray-500 text-xl" />
        <div className="flex-1 text-left">
          <p className="font-bold text-gray-900 dark:text-white text-sm">Request report</p>
        </div>
      </div>
    </div>
  </div>
);

const DeleteAccountPanel = ({ onBack }) => (
  <div className="flex flex-col h-full bg-white dark:bg-[#111b21]">
    <NestedPanelHeader title="Delete account" onBack={onBack} />
    <div className="p-6">
      <div className="flex gap-4 text-red-500 mb-6">
        <FaTrash size={24} />
        <div>
          <p className="font-bold">If you delete your account:</p>
          <ul className="list-disc pl-4 text-sm text-gray-500 mt-2 space-y-1">
            <li>The account will be deleted from SkillLinked and all your devices</li>
            <li>Your message history will be erased</li>
            <li>You will be removed from all your groups</li>
          </ul>
        </div>
      </div>
      <button className="w-full py-3 bg-red-500 text-white font-bold rounded-xl mt-4">Delete account</button>
    </div>
  </div>
);