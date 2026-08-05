import React, { useState } from 'react';
import { NestedPanelHeader, SettingAction, SettingToggle } from './SettingsPanels';
import { 
  FaDatabase, FaNetworkWired, FaHdd, FaWifi, FaPhotoVideo, 
  FaFacebook, FaInstagram, FaShareAlt, 
  FaUniversalAccess, FaSearchPlus, FaAdjust,
  FaGlobeAmericas, FaLanguage,
  FaCheckCircle, FaStar, FaShieldAlt
} from 'react-icons/fa';

export const StorageDataPanel = ({ onBack }) => {
  const [autoDownload, setAutoDownload] = useState(true);
  const [lessData, setLessData] = useState(false);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21] z-40 absolute inset-0">
      <NestedPanelHeader title="Storage and data" onBack={onBack} />
      <div className="flex-1 overflow-y-auto">
        <SettingAction icon={<FaDatabase />} title="Manage storage" subtitle="50.2 MB" onClick={() => {}} />
        <SettingAction icon={<FaNetworkWired />} title="Network usage" subtitle="2.1 GB sent • 4.3 GB received" onClick={() => {}} />
        <SettingToggle icon={<FaWifi />} title="Use less data for calls" value={lessData} onChange={setLessData} />
        
        <div className="mt-4 px-4 py-2 border-b border-gray-100 dark:border-gray-800">
          <p className="text-xs font-bold text-gray-500 uppercase">Media auto-download</p>
          <p className="text-xs text-gray-400 mt-1">Voice messages are always auto-downloaded</p>
        </div>
        <SettingAction title="When using mobile data" subtitle="Photos" onClick={() => {}} />
        <SettingAction title="When connected on Wi-Fi" subtitle="All media" onClick={() => {}} />
        <SettingAction title="When roaming" subtitle="No media" onClick={() => {}} />
      </div>
    </div>
  );
};

export const FacebookInstagramPanel = ({ onBack }) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21] z-40 absolute inset-0">
      <NestedPanelHeader title="Facebook & Instagram" onBack={onBack} />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 flex flex-col items-center text-center border-b border-gray-100 dark:border-gray-800">
          <div className="flex gap-4 mb-4">
            <FaFacebook className="text-blue-600 text-5xl" />
            <FaInstagram className="text-pink-600 text-5xl" />
          </div>
          <p className="font-bold text-gray-900 dark:text-gray-100 text-lg">Share to other apps</p>
          <p className="text-gray-500 text-sm mt-2">Connect your accounts to easily share your status updates across Meta apps.</p>
        </div>
        <SettingAction icon={<FaFacebook className="text-blue-600" />} title="Facebook" subtitle="Not connected" onClick={() => {}} />
        <SettingAction icon={<FaInstagram className="text-pink-600" />} title="Instagram" subtitle="Not connected" onClick={() => {}} />
      </div>
    </div>
  );
};

export const AccessibilityPanel = ({ onBack }) => {
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21] z-40 absolute inset-0">
      <NestedPanelHeader title="Accessibility" onBack={onBack} />
      <div className="flex-1 overflow-y-auto">
        <SettingToggle icon={<FaSearchPlus />} title="Large text" subtitle="Increase font size across the app" value={largeText} onChange={setLargeText} />
        <SettingToggle icon={<FaAdjust />} title="High contrast" subtitle="Improve visibility of UI elements" value={highContrast} onChange={setHighContrast} />
      </div>
    </div>
  );
};

export const AppLanguagePanel = ({ onBack }) => {
  const languages = [
    { code: 'en', name: 'English', sub: "Device's language" },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'ur', name: 'اردو' },
  ];
  const [selected, setSelected] = useState('en');

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21] z-40 absolute inset-0">
      <NestedPanelHeader title="App language" onBack={onBack} />
      <div className="flex-1 overflow-y-auto">
        {languages.map(lang => (
          <div key={lang.code} onClick={() => setSelected(lang.code)}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1a2329] border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-[#202c33] transition-colors cursor-pointer">
            <div>
              <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-200">{lang.name}</p>
              {lang.sub && <p className="text-[13px] text-gray-500">{lang.sub}</p>}
            </div>
            {selected === lang.code && <div className="w-5 h-5 rounded-full bg-green-500 border-4 border-gray-50 dark:border-[#1a2329]" />}
            {selected !== lang.code && <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export const MetaVerifiedPanel = ({ onBack }) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21] z-40 absolute inset-0">
      <NestedPanelHeader title="Meta Verified" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center text-center">
        <FaCheckCircle className="text-blue-500 text-6xl mb-6" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Build trust with Meta Verified</h3>
        <p className="text-gray-500 text-sm mb-8">Get a verified badge, proactive account protection, and access to direct account support.</p>
        
        <div className="space-y-4 w-full mb-8">
          <div className="flex items-start gap-3 text-left">
            <FaStar className="text-blue-500 mt-1" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-200">Verified badge</p>
              <p className="text-xs text-gray-500">Your audience can trust that you're a real person sharing your real stories.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-left">
            <FaShieldAlt className="text-blue-500 mt-1" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-200">Increased account protection</p>
              <p className="text-xs text-gray-500">Worry less about impersonation with proactive monitoring.</p>
            </div>
          </div>
        </div>

        <button className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors">
          Subscribe
        </button>
      </div>
    </div>
  );
};
