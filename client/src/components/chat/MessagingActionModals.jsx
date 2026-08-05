import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaQrcode, FaBullhorn, FaUsers, FaListUl, FaAd } from 'react-icons/fa';

export const ActionModal = ({ isOpen, onClose, title, icon, children }) => {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-white dark:bg-[#111b21] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-[#202c33]/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                {icon}
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">{title}</h3>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              <FaTimes />
            </button>
          </div>
          <div className="p-6">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const LinkedDevicesModal = ({ isOpen, onClose }) => {
  return (
    <ActionModal isOpen={isOpen} onClose={onClose} title="Linked Devices" icon={<FaQrcode size={18} />}>
      <div className="text-center space-y-4">
        <div className="bg-gray-100 dark:bg-[#2a3942] w-48 h-48 mx-auto rounded-xl flex items-center justify-center border-4 border-white dark:border-[#202c33] shadow-inner">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SkillLinkedSync" alt="QR Code" className="opacity-80 mix-blend-multiply dark:mix-blend-normal dark:invert" />
        </div>
        <h4 className="text-gray-900 dark:text-gray-100 font-semibold">Use SkillLinked on other devices</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Open SkillLinked on your computer and scan this QR code to sync your chats.
        </p>
        <button onClick={onClose} className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors">
          Link a Device
        </button>
      </div>
    </ActionModal>
  );
};

export const AdvertiseModal = ({ isOpen, onClose }) => {
  return (
    <ActionModal isOpen={isOpen} onClose={onClose} title="Advertise" icon={<FaAd size={18} />}>
      <div className="text-center space-y-4">
        <img src="https://cdn-icons-png.flaticon.com/512/1973/1973685.png" alt="Advertise" className="w-24 h-24 mx-auto opacity-80 mb-2" />
        <h4 className="text-gray-900 dark:text-gray-100 font-semibold">Reach more people on SkillLinked</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Create ads that reach your target audience and grow your business network directly through messaging.
        </p>
        <button onClick={onClose} className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors">
          Create Ad Campaign
        </button>
      </div>
    </ActionModal>
  );
};

export const BroadcastModal = ({ isOpen, onClose }) => {
  return (
    <ActionModal isOpen={isOpen} onClose={onClose} title="Business Broadcasts" icon={<FaBullhorn size={18} />}>
      <div className="text-center space-y-4">
        <div className="bg-green-50 dark:bg-green-900/20 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2">
          <FaBullhorn size={24} />
        </div>
        <h4 className="text-gray-900 dark:text-gray-100 font-semibold">Message multiple contacts</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Only contacts with your number in their address book will receive your broadcast messages.
        </p>
        <button onClick={onClose} className="w-full py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors">
          New Broadcast List
        </button>
      </div>
    </ActionModal>
  );
};

export const CommunitiesModal = ({ isOpen, onClose }) => {
  return (
    <ActionModal isOpen={isOpen} onClose={onClose} title="Communities" icon={<FaUsers size={18} />}>
      <div className="text-center space-y-4">
        <img src="https://cdn-icons-png.flaticon.com/512/3252/3252906.png" alt="Communities" className="w-24 h-24 mx-auto opacity-80 mb-2" />
        <h4 className="text-gray-900 dark:text-gray-100 font-semibold">Introducing Communities</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Easily organize your related groups and send announcements. Now your communities, like neighborhoods or schools, can have their own space.
        </p>
        <button onClick={onClose} className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors">
          Start your Community
        </button>
      </div>
    </ActionModal>
  );
};

export const ListsModal = ({ isOpen, onClose }) => {
  return (
    <ActionModal isOpen={isOpen} onClose={onClose} title="Lists" icon={<FaListUl size={18} />}>
      <div className="text-center space-y-4">
        <div className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2">
          <FaListUl size={24} />
        </div>
        <h4 className="text-gray-900 dark:text-gray-100 font-semibold">Organize your chats</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Create custom lists to filter and organize your chats, making it easier to find the people and groups that matter most.
        </p>
        <button onClick={onClose} className="w-full py-3 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 transition-colors">
          Create a List
        </button>
      </div>
    </ActionModal>
  );
};
