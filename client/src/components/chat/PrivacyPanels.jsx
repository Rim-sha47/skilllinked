import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NestedPanelHeader, SettingAction, SettingToggle, SettingSelect } from './SettingsPanels';

export const PrivacyPanel = ({ onBack, onOpenBlockedContacts }) => {
  const [activeSubModal, setActiveSubModal] = useState(null);

  // States
  const [readReceipts, setReadReceipts] = useState(true);
  const [cameraEffects, setCameraEffects] = useState(false);

  const renderSubModal = () => {
    switch(activeSubModal) {
      case 'lastseen': return <LastSeenPanel onBack={() => setActiveSubModal(null)} />;
      case 'profilePhoto': return <GenericPrivacySelect title="Profile picture" onBack={() => setActiveSubModal(null)} />;
      case 'about': return <GenericPrivacySelect title="About" onBack={() => setActiveSubModal(null)} />;
      case 'status': return <GenericPrivacySelect title="Status" onBack={() => setActiveSubModal(null)} />;
      case 'timer': return <TimerPanel onBack={() => setActiveSubModal(null)} />;
      case 'groups': return <GenericPrivacySelect title="Groups" onBack={() => setActiveSubModal(null)} />;
      case 'liveLocation': return <LiveLocationPanel onBack={() => setActiveSubModal(null)} />;
      case 'calls': return <CallsPanel onBack={() => setActiveSubModal(null)} />;
      case 'chatLock': return <ChatLockPanel onBack={() => setActiveSubModal(null)} />;
      case 'advanced': return <AdvancedPrivacyPanel onBack={() => setActiveSubModal(null)} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21] z-40 absolute inset-0">
      <NestedPanelHeader title="Privacy" onBack={onBack} />
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 text-[13px] font-bold text-gray-500 uppercase tracking-wide">Who can see my personal info</div>
        <SettingAction title="Last seen and online" subtitle="Nobody" onClick={() => setActiveSubModal('lastseen')} />
        <SettingAction title="Profile picture" subtitle="Everyone" onClick={() => setActiveSubModal('profilePhoto')} />
        <SettingAction title="About" subtitle="Everyone" onClick={() => setActiveSubModal('about')} />
        <SettingAction title="Status" subtitle="My contacts" onClick={() => setActiveSubModal('status')} />
        
        <SettingToggle title="Read receipts" subtitle="If turned off, you won't send or receive read receipts. Read receipts are always sent for group chats." value={readReceipts} onChange={setReadReceipts} />

        <div className="px-4 py-3 mt-2 text-[13px] font-bold text-gray-500 uppercase tracking-wide">Disappearing messages</div>
        <SettingAction title="Default message timer" subtitle="Off" onClick={() => setActiveSubModal('timer')} />

        <div className="h-2 bg-gray-50 dark:bg-black/20" />

        <SettingAction title="Groups" subtitle="Everyone" onClick={() => setActiveSubModal('groups')} />
        <SettingAction title="Live location" subtitle="None" onClick={() => setActiveSubModal('liveLocation')} />
        <SettingAction title="Calls" subtitle="Silence unknown callers" onClick={() => setActiveSubModal('calls')} />
        <SettingAction title="Blocked contacts" subtitle="Manage blocked users" onClick={onOpenBlockedContacts} />
        <SettingAction title="Chat lock" onClick={() => setActiveSubModal('chatLock')} />
        
        <SettingToggle title="Allow camera effects" subtitle="Allow camera effects for video calls." value={cameraEffects} onChange={setCameraEffects} />

        <SettingAction title="Advanced" subtitle="Protect IP address in calls" onClick={() => setActiveSubModal('advanced')} />
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

const GenericPrivacySelect = ({ title, onBack }) => {
  const [value, setValue] = useState('Everyone');
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21]">
      <NestedPanelHeader title={title} onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-[13px] font-bold text-gray-500 uppercase tracking-wide mb-2">Who can see my {title.toLowerCase()}</div>
        {['Everyone', 'My contacts', 'My contacts except...', 'Nobody'].map(opt => (
          <label key={opt} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-[#202c33] rounded-xl cursor-pointer">
            <input type="radio" name={title} checked={value === opt} onChange={() => setValue(opt)} className="w-4 h-4 text-blue-500" />
            <span className="text-gray-900 dark:text-gray-100">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

const LastSeenPanel = ({ onBack }) => {
  const [who, setWho] = useState('Nobody');
  const [online, setOnline] = useState('Same as last seen');
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21]">
      <NestedPanelHeader title="Last seen and online" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-[13px] font-bold text-gray-500 uppercase tracking-wide mb-2">Who can see my last seen</div>
        {['Everyone', 'My contacts', 'My contacts except...', 'Nobody'].map(opt => (
          <label key={opt} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-[#202c33] rounded-xl cursor-pointer">
            <input type="radio" name="lastseen" checked={who === opt} onChange={() => setWho(opt)} className="w-4 h-4 text-blue-500" />
            <span className="text-gray-900 dark:text-gray-100">{opt}</span>
          </label>
        ))}

        <div className="text-[13px] font-bold text-gray-500 uppercase tracking-wide mt-6 mb-2">Who can see when I'm online</div>
        {['Everyone', 'Same as last seen'].map(opt => (
          <label key={opt} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-[#202c33] rounded-xl cursor-pointer">
            <input type="radio" name="online" checked={online === opt} onChange={() => setOnline(opt)} className="w-4 h-4 text-blue-500" />
            <span className="text-gray-900 dark:text-gray-100">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

const TimerPanel = ({ onBack }) => {
  const [timer, setTimer] = useState('Off');
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21]">
      <NestedPanelHeader title="Default message timer" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-sm text-gray-500 mb-4">When turned on, all new individual chats will start with disappearing messages set to the selected duration.</div>
        {['24 hours', '7 days', '90 days', 'Off'].map(opt => (
          <label key={opt} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-[#202c33] rounded-xl cursor-pointer">
            <input type="radio" name="timer" checked={timer === opt} onChange={() => setTimer(opt)} className="w-4 h-4 text-blue-500" />
            <span className="text-gray-900 dark:text-gray-100">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

const LiveLocationPanel = ({ onBack }) => (
  <div className="flex flex-col h-full bg-white dark:bg-[#111b21]">
    <NestedPanelHeader title="Live location" onBack={onBack} />
    <div className="p-6 text-center text-gray-500 text-sm">
      <p>You aren't sharing live location in any chats.</p>
    </div>
  </div>
);

const CallsPanel = ({ onBack }) => {
  const [silence, setSilence] = useState(false);
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21]">
      <NestedPanelHeader title="Calls" onBack={onBack} />
      <div className="flex-1 overflow-y-auto">
        <SettingToggle title="Silence unknown callers" subtitle="Calls from unknown numbers will be silenced. They will still be shown in the Calls tab and in your notifications." value={silence} onChange={setSilence} />
      </div>
    </div>
  );
};

const ChatLockPanel = ({ onBack }) => {
  const [lock, setLock] = useState(false);
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21]">
      <NestedPanelHeader title="Chat lock" onBack={onBack} />
      <div className="flex-1 overflow-y-auto">
        <SettingToggle title="Unlock with face or fingerprint" subtitle="Use biometrics to open your locked chats." value={lock} onChange={setLock} />
      </div>
    </div>
  );
};

const AdvancedPrivacyPanel = ({ onBack }) => {
  const [ip, setIp] = useState(false);
  const [previews, setPreviews] = useState(false);
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21]">
      <NestedPanelHeader title="Advanced" onBack={onBack} />
      <div className="flex-1 overflow-y-auto">
        <SettingToggle title="Protect IP address in calls" subtitle="To make it harder for people to infer your location, calls on this device will be securely relayed." value={ip} onChange={setIp} />
        <SettingToggle title="Disable link previews" subtitle="To help protect your IP address from third-party websites, previews for links you share will no longer be generated." value={previews} onChange={setPreviews} />
      </div>
    </div>
  );
};
