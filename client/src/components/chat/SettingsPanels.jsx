import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaArrowLeft, FaCheckCircle, FaKey, FaShieldAlt, FaMobileAlt,
  FaDatabase, FaUniversalAccess, FaGlobe, FaUserFriends, FaFacebook,
  FaInstagram, FaQuestionCircle, FaUserShield, FaClock, FaMapMarkerAlt,
  FaPhoneSlash, FaBan, FaLock, FaMagic, FaUserSecret, FaCloudUploadAlt,
  FaEnvelope, FaExchangeAlt, FaIdBadge, FaBriefcase, FaFileDownload, FaTrash
} from 'react-icons/fa';

// Common Panel Header for nested settings
export const NestedPanelHeader = ({ title, onBack }) => (
  <div className="flex items-center gap-4 p-4 bg-gray-50/90 dark:bg-[#202c33]/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
    <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
      <FaArrowLeft size={16} />
    </button>
    <h2 className="text-[17px] font-bold text-gray-900 dark:text-gray-100">{title}</h2>
  </div>
);

// Generic Setting Toggle Row
export const SettingToggle = ({ icon, title, subtitle, value, onChange }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1a2329] border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-[#202c33] transition-colors cursor-pointer" onClick={() => onChange(!value)}>
    <div className="flex items-center gap-4">
      {icon && <div className="text-gray-500 dark:text-gray-400">{icon}</div>}
      <div>
        <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-200">{title}</p>
        {subtitle && <p className="text-[13px] text-gray-500">{subtitle}</p>}
      </div>
    </div>
    <div className={`relative w-10 h-5 rounded-full transition-colors ${value ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? 'left-5' : 'left-0.5'}`} />
    </div>
  </div>
);

// Generic Setting Select Row
export const SettingSelect = ({ icon, title, subtitle, value, options, onChange }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1a2329] border-b border-gray-100 dark:border-gray-800">
    <div className="flex items-center gap-4">
      {icon && <div className="text-gray-500 dark:text-gray-400">{icon}</div>}
      <div>
        <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-200">{title}</p>
        {subtitle && <p className="text-[13px] text-gray-500">{subtitle}</p>}
      </div>
    </div>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

// Generic Action Row
export const SettingAction = ({ icon, title, subtitle, onClick, textColor = "text-gray-900 dark:text-gray-200" }) => (
  <button onClick={onClick} className="w-full flex items-center gap-4 p-4 bg-gray-50 dark:bg-[#1a2329] border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-[#202c33] transition-colors text-left">
    {icon && <div className="text-gray-500 dark:text-gray-400">{icon}</div>}
    <div>
      <p className={`text-[15px] font-semibold ${textColor}`}>{title}</p>
      {subtitle && <p className="text-[13px] text-gray-500">{subtitle}</p>}
    </div>
  </button>
);

// ────────────────────────────────────────────────────────
// NEW SETTINGS SUB-MODALS
// ────────────────────────────────────────────────────────

export const StorageDataPanel = ({ onBack }) => (
  <div className="flex flex-col h-full bg-white dark:bg-[#111b21] z-50 absolute inset-0">
    <NestedPanelHeader title="Storage and data" onBack={onBack} />
    <div className="flex-1 overflow-y-auto">
      <SettingAction icon={<FaDatabase />} title="Manage storage" subtitle="5.2 GB used" />
      <SettingAction icon={<FaDatabase />} title="Network usage" subtitle="2.1 GB sent • 4.3 GB received" />
      <SettingToggle title="Use less data for calls" value={false} onChange={() => {}} />
      <div className="p-4 text-sm font-semibold text-gray-500 uppercase">Media auto-download</div>
      <SettingSelect title="When using mobile data" value="Photos" options={['No media', 'Photos', 'All media']} onChange={() => {}} />
      <SettingSelect title="When connected on Wi-Fi" value="All media" options={['No media', 'Photos', 'All media']} onChange={() => {}} />
    </div>
  </div>
);

export const AppLanguagePanel = ({ onBack }) => {
  const [lang, setLang] = useState('English');
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21] z-50 absolute inset-0">
      <NestedPanelHeader title="App language" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-2">
        {['English', 'Urdu', 'Spanish', 'French', 'Arabic'].map(l => (
          <label key={l} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-[#202c33] rounded-xl cursor-pointer">
            <input type="radio" name="lang" checked={lang === l} onChange={() => setLang(l)} className="w-4 h-4 text-blue-500" />
            <span className="text-gray-900 dark:text-gray-100">{l}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export const AccessibilityPanel = ({ onBack }) => {
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21] z-50 absolute inset-0">
      <NestedPanelHeader title="Accessibility" onBack={onBack} />
      <div className="flex-1 overflow-y-auto">
        <SettingToggle icon={<FaUniversalAccess />} title="High contrast text" value={highContrast} onChange={setHighContrast} />
        <SettingToggle icon={<FaUniversalAccess />} title="Large text layout" value={largeText} onChange={setLargeText} />
      </div>
    </div>
  );
};

export const MetaVerifiedPanel = ({ onBack }) => (
  <div className="flex flex-col h-full bg-white dark:bg-[#111b21] z-50 absolute inset-0">
    <NestedPanelHeader title="Meta Verified" onBack={onBack} />
    <div className="flex-1 overflow-y-auto p-6 text-center space-y-4">
      <FaCheckCircle className="text-blue-500 w-16 h-16 mx-auto" />
      <h3 className="text-xl font-bold dark:text-white">Join Meta Verified</h3>
      <p className="text-gray-500 text-sm">
        Build trust with your audience. Get a verified badge, proactive account protection, and access to direct account support.
      </p>
      <button className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl mt-4">
        Subscribe
      </button>
    </div>
  </div>
);

export const FacebookInstagramPanel = ({ onBack }) => (
  <div className="flex flex-col h-full bg-white dark:bg-[#111b21] z-50 absolute inset-0">
    <NestedPanelHeader title="Facebook & Instagram" onBack={onBack} />
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <button className="w-full flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
        <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 font-bold">
          <FaFacebook size={24} /> Connect Facebook
        </div>
      </button>
      <button className="w-full flex items-center justify-between p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
        <div className="flex items-center gap-3 text-pink-600 dark:text-pink-400 font-bold">
          <FaInstagram size={24} /> Connect Instagram
        </div>
      </button>
    </div>
  </div>
);
