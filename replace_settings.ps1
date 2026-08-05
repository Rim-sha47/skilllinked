$file = "c:\Users\hp\OneDrive\Desktop\skilllinked\client\src\pages\Messaging\SidebarPanels.jsx"
$lines = [System.IO.File]::ReadAllLines($file, [System.Text.Encoding]::UTF8)

$before = $lines[0..973]  # lines 1-974 (0-indexed: 0..973)
$after = $lines[1327..($lines.Count - 1)]  # lines 1328+ (0-indexed: 1327+)

$newSettingsPanel = @'
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SETTINGS PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const SettingsPanel = ({ onBack, onNavigate }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { blockedUserDetails } = useSelector(s => s.messaging);

  const [activeModal, setActiveModal] = useState(null);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSent, setSupportSent] = useState(false);

  useEffect(() => {
    if (activeModal === 'blockedContacts') dispatch(fetchBlockedUsers());
  }, [activeModal, dispatch]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      dispatch(logout());
      window.location.href = '/login';
    }
  };

  const handleSendSupport = (e) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    setSupportSent(true);
    setTimeout(() => { setSupportSent(false); setSupportMessage(''); }, 3000);
  };

  const settingsItems = [
    { icon: <FaShieldAlt size={15} className="text-teal-500" />, bg: 'bg-teal-100 dark:bg-teal-900/30', label: 'Meta Verified', sub: 'Build trust with a verified badge', modal: 'metaVerified' },
    { icon: <FaUserCircle size={15} className="text-blue-500" />, bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Account', sub: 'Security notifications, change number', modal: 'account' },
    { icon: <FaLock size={15} className="text-gray-500" />, bg: 'bg-gray-100 dark:bg-gray-700/50', label: 'Privacy', sub: 'Last seen, blocked contacts', modal: 'privacy' },
    { icon: <FaGlobeAmericas size={15} className="text-purple-500" />, bg: 'bg-purple-100 dark:bg-purple-900/30', label: 'Lists', sub: 'Manage your chat lists', modal: 'lists' },
    { icon: <FaCommentDots size={15} className="text-green-500" />, bg: 'bg-green-100 dark:bg-green-900/30', label: 'Chats', sub: 'Theme, wallpapers, chat history', modal: 'chats' },
    { icon: <FaBell size={15} className="text-yellow-500" />, bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Notifications', sub: notifEnabled ? 'Message, group & call tones' : 'Notifications muted', toggle: notifEnabled, action: () => setNotifEnabled(n => !n) },
    { icon: <FaArrowRight size={15} className="text-blue-400" />, bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Storage and data', sub: 'Network usage, auto-download', modal: 'storage' },
    { icon: <span className="font-extrabold text-sm text-blue-600 dark:text-blue-400">f</span>, bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Facebook & Instagram', sub: 'Share your SkillLinked status', modal: 'fbig' },
    { icon: <FaUser size={15} className="text-orange-500" />, bg: 'bg-orange-100 dark:bg-orange-900/30', label: 'Accessibility', sub: 'Font size, high contrast', modal: 'accessibility' },
    { icon: <FaGlobeAmericas size={15} className="text-indigo-500" />, bg: 'bg-indigo-100 dark:bg-indigo-900/30', label: 'App language', sub: 'English (device language)', modal: 'appLanguage' },
    { icon: <FaQuestionCircle size={15} className="text-teal-500" />, bg: 'bg-teal-100 dark:bg-teal-900/30', label: 'Help and feedback', sub: 'FAQ, contact us, privacy policy', modal: 'help' },
    {
      icon: <FaUserFriends size={15} className="text-green-500" />, bg: 'bg-green-100 dark:bg-green-900/30',
      label: 'Invite a contact', sub: 'Share SkillLinked with friends',
      action: () => { if (navigator.share) navigator.share({ title: 'Join SkillLinked', text: 'Connect with me on SkillLinked!', url: window.location.origin }); else alert('Share link: ' + window.location.origin); }
    },
  ];

  const renderSubModal = () => {
    switch (activeModal) {
      case 'account': return <AccountPanel onBack={() => setActiveModal(null)} />;
      case 'privacy': return <PrivacyPanel onBack={() => setActiveModal(null)} onOpenBlockedContacts={() => setActiveModal('blockedContacts')} />;
      case 'storage': return <StorageDataPanel onBack={() => setActiveModal(null)} />;
      case 'fbig': return <FacebookInstagramPanel onBack={() => setActiveModal(null)} />;
      case 'accessibility': return <AccessibilityPanel onBack={() => setActiveModal(null)} />;
      case 'appLanguage': return <AppLanguagePanel onBack={() => setActiveModal(null)} />;
      case 'metaVerified': return <MetaVerifiedPanel onBack={() => setActiveModal(null)} />;
      default: return null;
    }
  };

  const COMPONENT_MODALS = ['account', 'privacy', 'storage', 'fbig', 'accessibility', 'appLanguage', 'metaVerified'];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21] relative">
      <PanelHeader title="Settings" onBack={onBack} />

      <div className="px-4 py-3.5 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1a2329] cursor-pointer transition-colors"
        onClick={() => onNavigate('profile')}>
        <Avatar user={user} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 dark:text-white text-[17px] truncate">{getUserName(user)}</p>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 truncate">{user?.headline || user?.bio || 'Hey there! I am using SkillLinked.'}</p>
        </div>
        <FaChevronRight size={13} className="text-gray-400" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {settingsItems.map((item, i) => (
          <button key={i}
            onClick={item.action || (() => item.modal && setActiveModal(item.modal))}
            className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-[#202c33] transition-colors text-left border-b border-gray-50 dark:border-gray-800/30">
            <div className={`w-9 h-9 rounded-full ${item.bg} flex items-center justify-center flex-shrink-0`}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 dark:text-gray-200 text-[15px]">{item.label}</p>
              <p className="text-[13px] text-gray-400 truncate">{item.sub}</p>
            </div>
            {item.toggle !== undefined ? (
              <div className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${item.toggle ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${item.toggle ? 'left-5' : 'left-0.5'}`} />
              </div>
            ) : (
              <FaChevronRight size={12} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
            )}
          </button>
        ))}

        <button onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left mt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
            <FaSignOutAlt size={15} className="text-red-500" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-red-500 text-[15px]">Logout</p>
            <p className="text-[13px] text-gray-400">Sign out of SkillLinked</p>
          </div>
        </button>
      </div>

      <AnimatePresence>
        {activeModal === 'chats' && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute inset-0 z-30 bg-white dark:bg-[#111b21] flex flex-col">
            <PanelHeader title="Chats" onBack={() => setActiveModal(null)} />
            <div className="flex-1 overflow-y-auto custom-scrollbar"><ChatSettings /></div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === 'lists' && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute inset-0 z-30 bg-white dark:bg-[#111b21] flex flex-col">
            <PanelHeader title="Lists" onBack={() => setActiveModal(null)} />
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-3">
              <FaGlobeAmericas className="text-purple-400 text-5xl" />
              <p className="font-bold text-gray-900 dark:text-gray-100 text-lg">Organize your chats</p>
              <p className="text-gray-500 text-sm">Create custom lists to filter your chats.</p>
              <button className="mt-2 px-6 py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-colors">Create a list</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === 'help' && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute inset-0 z-30 bg-white dark:bg-[#111b21] flex flex-col">
            <PanelHeader title="Help and feedback" onBack={() => setActiveModal(null)} />
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {[
                { label: 'Help Centre', sub: 'Get help or contact us' },
                { label: 'Contact us', sub: 'Submit a support request' },
                { label: 'Terms and Privacy Policy', sub: 'Read our terms and policies' },
                { label: 'App info', sub: 'Version 1.0.0' },
              ].map((item, i) => (
                <button key={i} className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-[#202c33] transition-colors text-left border-b border-gray-50 dark:border-gray-800/40">
                  <div>
                    <p className="font-semibold text-[15px] text-gray-800 dark:text-gray-200">{item.label}</p>
                    <p className="text-[13px] text-gray-400">{item.sub}</p>
                  </div>
                  <FaChevronRight size={12} className="text-gray-300" />
                </button>
              ))}
              <div className="p-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase">Frequently Asked Questions</h4>
                {[
                  { q: 'How do I edit or delete a message?', a: 'Hover over your message and click the options dropdown.' },
                  { q: 'How do audio and video calls work?', a: 'Click the Phone or Camera icons at the top right of any chat.' },
                  { q: 'How do 24-hour Status updates work?', a: 'Navigate to Status tab to share updates that expire after 24 hours.' },
                ].map((faq, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-[#1a2329] rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                    <button onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                      className="w-full flex justify-between items-center p-3 text-left font-medium text-[13px] text-gray-800 dark:text-gray-200">
                      <span>{faq.q}</span>
                      <FaChevronRight size={10} className={`transform transition-transform ${expandedFaq === idx ? 'rotate-90 text-blue-500' : 'text-gray-400'}`} />
                    </button>
                    {expandedFaq === idx && (
                      <div className="px-3 pb-3 pt-1 text-[13px] text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800/60">{faq.a}</div>
                    )}
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendSupport} className="p-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase">Contact Support</h4>
                {supportSent && <p className="text-xs font-semibold text-teal-500">Thank you! Ticket submitted successfully.</p>}
                <textarea placeholder="Describe your issue or feedback..." value={supportMessage} onChange={e => setSupportMessage(e.target.value)}
                  rows={3} className="w-full p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-[13px] text-gray-800 dark:text-gray-200 outline-none resize-none" />
                <button type="submit" disabled={!supportMessage.trim()}
                  className="w-full py-2.5 rounded-xl bg-teal-500 text-white font-semibold text-sm hover:bg-teal-600 disabled:opacity-50 transition-colors">Submit Ticket</button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === 'blockedContacts' && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute inset-0 z-50 bg-white dark:bg-[#111b21] flex flex-col">
            <PanelHeader title="Blocked contacts" onBack={() => setActiveModal('privacy')} />
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {!blockedUserDetails?.length ? (
                <div className="text-center py-16 px-6">
                  <div className="text-5xl mb-4">&#128683;</div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No blocked contacts</p>
                </div>
              ) : (
                <div className="py-2">
                  {blockedUserDetails.map(u => (
                    <div key={u._id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#202c33] transition-colors border-b border-gray-50 dark:border-gray-800/40">
                      <Avatar user={u} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-[15px] truncate">{getUserName(u)}</p>
                        <p className="text-[13px] text-gray-400 truncate">{u.headline || '@' + u.username}</p>
                      </div>
                      <button onClick={() => { if (window.confirm('Unblock ' + getUserName(u) + '?')) dispatch(blockUser(u._id)); }}
                        className="px-3 py-1.5 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {COMPONENT_MODALS.includes(activeModal) && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute inset-0 z-30">
            {renderSubModal()}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

'@

$combined = $before + ($newSettingsPanel -split "`n") + $after
[System.IO.File]::WriteAllLines($file, $combined, [System.Text.Encoding]::UTF8)
Write-Host "Done. Total lines: $($combined.Count)"
