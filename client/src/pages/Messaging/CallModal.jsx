import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPhone, FaVideo, FaMicrophone, FaMicrophoneSlash,
  FaVideoSlash, FaPhoneSlash, FaUsers, FaVolumeMute, FaVolumeUp,
  FaCompress, FaExpand, FaSync, FaBan, FaSignal, FaShieldAlt,
} from "react-icons/fa";

const getUserName = (u) => u?.fullName || u?.name || u?.username || "User";
const getAvatar = (u) => {
  const p = u?.profilePicture || u?.avatar || null;
  return p === "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg" ? null : p;
};

// ─── Web Audio Ringtone ──────────────────────────────────────────────────────
const useRingtone = (playing, ringtoneMuted) => {
  const audioCtxRef = useRef(null);
  const intervalRef = useRef(null);

  const playBeep = useCallback(() => {
    if (ringtoneMuted) return;
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const times = [[0, 880], [0.15, 1100], [0.3, 990]];
      times.forEach(([t, freq]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + t);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.13);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.14);
      });
    } catch (_) {}
  }, [ringtoneMuted]);

  useEffect(() => {
    if (playing && !ringtoneMuted) {
      playBeep();
      intervalRef.current = setInterval(playBeep, 2200);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, ringtoneMuted, playBeep]);
};

// ─── Avatar with Ripple ───────────────────────────────────────────────────────
const CallerAvatar = ({ user, isGroup, chatName, pulse }) => {
  const COLORS = ["from-blue-500 to-indigo-700", "from-purple-500 to-pink-600", "from-emerald-500 to-teal-700", "from-orange-500 to-red-600"];
  const name = isGroup ? (chatName || "Group") : getUserName(user);
  const avatarUrl = isGroup ? null : getAvatar(user);
  const colorIdx = (name?.charCodeAt(0) || 0) % COLORS.length;

  return (
    <div className="relative flex items-center justify-center w-32 h-32 md:w-36 md:h-36">
      {pulse && [0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2 border-emerald-400/30"
          style={{ width: `${128 + i * 44}px`, height: `${128 + i * 44}px` }}
          animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.55, ease: "easeInOut" }}
        />
      ))}
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="w-32 h-32 md:w-36 md:h-36 rounded-full object-cover ring-4 ring-white/20 shadow-2xl z-10" />
      ) : (
        <div className={`w-32 h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-br ${COLORS[colorIdx]} text-white flex items-center justify-center font-bold text-4xl md:text-5xl shadow-2xl ring-4 ring-white/20 z-10`}>
          {isGroup ? <FaUsers size={40} /> : name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
};

// ─── Main WhatsApp Call Modal Component ───────────────────────────────────────
export const CallModal = ({ callState, onAccept, onReject, onEnd, socket, currentUserId }) => {
  const { active, receiving, caller, type, accepted, isGroup, chatName } = callState;

  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [ringtoneMuted, setRingtoneMuted] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [hasRemote, setHasRemote] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const [facingMode, setFacingMode] = useState("user");

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const startTimeRef = useRef(null);

  const isVisible = active || receiving;
  const isRinging = !accepted;
  const isVideoCall = type === "video";

  useRingtone(isVisible && !accepted, ringtoneMuted);

  // Duration Timer
  useEffect(() => {
    let t;
    if (accepted) {
      startTimeRef.current = Date.now();
      t = setInterval(() => setCallDuration(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(t);
  }, [accepted]);

  // Network offline & socket reconnect listeners
  useEffect(() => {
    const handleOffline = () => setReconnecting(true);
    const handleOnline = () => setReconnecting(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    socket?.on("call-reconnecting", () => setReconnecting(true));
    socket?.on("call-reconnected", () => setReconnecting(false));

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      socket?.off("call-reconnecting");
      socket?.off("call-reconnected");
    };
  }, [socket]);

  // WebRTC initialization
  useEffect(() => {
    if (!active) {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
      peerRef.current?.close();
      peerRef.current = null;
      setHasRemote(false);
      setMicMuted(false);
      setVideoOff(false);
      setMinimized(false);
      setMediaError(null);
      return;
    }

    let pc;
    const init = async () => {
      try {
        const constraints = {
          audio: { echoCancellation: true, noiseSuppression: true },
          video: isVideoCall ? { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        pc = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ],
        });
        peerRef.current = pc;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.ontrack = (ev) => {
          if (ev.streams[0]) {
            setHasRemote(true);
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = ev.streams[0];
          }
        };

        pc.onicecandidate = (ev) => {
          if (ev.candidate && caller) {
            socket?.emit("call-candidate", { to: caller._id || caller, candidate: ev.candidate });
          }
        };

        socket?.on("call-offer", async ({ offer, from }) => {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket?.emit("call-answer", { to: from || caller?._id || caller, answer });
        });

        socket?.on("call-answer", async ({ answer }) => {
          await pc.setRemoteDescription(new RTCSessionDescription(answer)).catch(() => {});
        });

        socket?.on("call-candidate", ({ candidate }) => {
          pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        });

        if (!receiving && !isGroup && accepted) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket?.emit("call-offer", { to: caller?._id || caller, offer });
        }
      } catch (err) {
        setMediaError(
          err.name === "NotAllowedError"
            ? "Camera/Mic access denied. Please grant permissions in your browser."
            : `Media error: ${err.message}`
        );
      }
    };

    init();
    return () => {
      socket?.off("call-offer");
      socket?.off("call-answer");
      socket?.off("call-candidate");
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      pc?.close();
    };
  }, [active, isVideoCall, accepted, facingMode]);

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.muted = speakerMuted;
  }, [speakerMuted]);

  if (!isVisible) return null;

  const toggleMic = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = micMuted; });
    setMicMuted(m => !m);
  };
  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = videoOff; });
    setVideoOff(v => !v);
  };
  const switchCamera = () => {
    setFacingMode(prev => (prev === "user" ? "environment" : "user"));
  };
  const triggerPiP = async () => {
    try {
      if (remoteVideoRef.current && document.pictureInPictureEnabled) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await remoteVideoRef.current.requestPictureInPicture();
        }
      }
    } catch (e) {
      console.error("PiP Error:", e);
    }
  };

  const fmt = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const displayName = isGroup ? (chatName || "Group Call") : getUserName(caller);

  // ── FLOATING MINIMIZED CALL BAR ──────────────────────────────────────────────
  if (minimized) {
    return (
      <motion.div
        drag
        dragConstraints={{ left: 0, right: 300, top: 0, bottom: 500 }}
        className="fixed top-20 right-5 z-[210] bg-gray-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-gray-700/80 backdrop-blur-md flex items-center gap-3 cursor-pointer"
        onClick={() => setMinimized(false)}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center font-bold text-sm">
          {isVideoCall ? <FaVideo size={16} /> : <FaPhone size={16} />}
        </div>
        <div className="min-w-0 pr-2">
          <p className="text-xs font-bold truncate max-w-[120px]">{displayName}</p>
          <p className="text-[10px] text-green-400 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {fmt(callDuration)}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setMinimized(false); }}
          className="p-1.5 rounded-full hover:bg-white/10 text-gray-300"
          title="Expand"
        >
          <FaExpand size={13} />
        </button>
      </motion.div>
    );
  }

  // ── FULLSCREEN CALL UI ───────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      <motion.div
        key="call-overlay"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[200] overflow-hidden flex flex-col bg-gray-950 select-none"
      >
        {/* ── Background ──────────────────────────────────── */}
        {isVideoCall ? (
          <div className="absolute inset-0 bg-black">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            {!hasRemote && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: `${350 + i * 140}px`, height: `${350 + i * 140}px`,
                      background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)",
                      top: "50%", left: "50%", transform: "translate(-50%,-50%)"
                    }}
                    animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.1, 0.4] }}
                    transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.7 }}
                  />
                ))}
              </div>
            )}
            {/* PiP Local Video View */}
            <div className="absolute bottom-32 right-4 w-28 h-40 md:w-36 md:h-48 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-gray-900 z-20">
              <video ref={localVideoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${videoOff ? "hidden" : ""}`} />
              {videoOff && (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <FaVideoSlash size={22} className="text-gray-500" />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-950">
            {[0, 1, 2, 3].map(i => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: `${280 + i * 150}px`, height: `${280 + i * 150}px`,
                  background: "radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)",
                  top: "50%", left: "50%", transform: "translate(-50%,-50%)"
                }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.08, 0.4] }}
                transition={{ duration: 3 + i * 0.8, repeat: Infinity, delay: i * 0.6 }}
              />
            ))}
          </div>
        )}

        {/* ── Header Bar ────────────────────────────────────────────── */}
        <div className="relative z-20 flex items-center justify-between px-6 pt-6">
          {/* Status Badge */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 border border-white/10">
            <div className={`w-2 h-2 rounded-full ${reconnecting ? "bg-red-500 animate-ping" : accepted ? "bg-green-400" : "bg-yellow-400 animate-pulse"}`} />
            <span className="text-white text-xs font-semibold tracking-wide">
              {reconnecting ? "Reconnecting..." : isVideoCall ? "WhatsApp Video Call" : "WhatsApp Voice Call"}
            </span>
          </div>

          {/* Action Header Icons */}
          <div className="flex items-center gap-3">
            {receiving && !accepted && (
              <button
                onClick={() => setRingtoneMuted(r => !r)}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all"
                title={ringtoneMuted ? "Unmute Ringtone" : "Mute Ringtone"}
              >
                {ringtoneMuted ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
              </button>
            )}

            {accepted && (
              <button
                onClick={() => setMinimized(true)}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all"
                title="Minimize Call"
              >
                <FaCompress size={15} />
              </button>
            )}
          </div>
        </div>

        {/* ── Main Content Area ─────────────────────────────────────── */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4">
          {(!isVideoCall || !hasRemote) && (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-6">
              <CallerAvatar user={caller} isGroup={isGroup} chatName={chatName} pulse={isRinging} />
            </motion.div>
          )}

          <motion.h2
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-white font-extrabold text-2xl md:text-3xl mb-2 text-center drop-shadow-md"
          >
            {displayName}
          </motion.h2>

          {/* Call Status / Timer */}
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col items-center gap-2">
            {reconnecting ? (
              <div className="flex items-center gap-2 bg-red-500/30 text-red-200 px-4 py-1.5 rounded-full border border-red-500/40">
                <FaSignal className="animate-pulse" /> Network Interrupted • Reconnecting...
              </div>
            ) : accepted ? (
              <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-full px-5 py-2 backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white font-mono text-lg font-bold tracking-widest">{fmt(callDuration)}</span>
              </div>
            ) : receiving ? (
              <div className="flex items-center gap-2">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-emerald-400"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
                <span className="text-emerald-300 text-sm font-semibold ml-1">Incoming Call...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-white/60"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25 }}
                  />
                ))}
                <span className="text-white/70 text-sm font-medium ml-1">Ringing...</span>
              </div>
            )}
          </motion.div>

          {mediaError && (
            <div className="mt-5 max-w-sm bg-red-500/20 border border-red-500/40 rounded-xl p-3 text-center">
              <p className="text-red-200 text-xs">{mediaError}</p>
            </div>
          )}
        </div>

        {/* ── WhatsApp Floating Control Panel ───────────────────────────── */}
        <div className="relative z-20 pb-10 px-6 flex justify-center">
          {receiving && !accepted ? (
            /* Incoming Call Screen Controls */
            <div className="flex items-center gap-16 md:gap-24">
              <div className="flex flex-col items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onReject}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-2xl"
                >
                  <FaPhoneSlash size={26} />
                </motion.button>
                <span className="text-white/60 text-xs font-semibold">Decline</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  onClick={onAccept}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-2xl"
                >
                  <FaPhone size={26} />
                </motion.button>
                <span className="text-white/60 text-xs font-semibold">Accept</span>
              </div>
            </div>
          ) : (
            /* Ongoing Call Controls */
            <div className="bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3.5 flex items-center gap-4 md:gap-6 shadow-2xl">
              {/* Mic */}
              <button
                onClick={toggleMic}
                className={`p-3.5 rounded-full text-white transition-all ${micMuted ? "bg-red-500" : "bg-white/10 hover:bg-white/20"}`}
                title={micMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                {micMuted ? <FaMicrophoneSlash size={18} /> : <FaMicrophone size={18} />}
              </button>

              {/* Speaker */}
              <button
                onClick={() => setSpeakerMuted(s => !s)}
                className={`p-3.5 rounded-full text-white transition-all ${speakerMuted ? "bg-red-500" : "bg-white/10 hover:bg-white/20"}`}
                title="Speaker Mode"
              >
                {speakerMuted ? <FaVolumeMute size={18} /> : <FaVolumeUp size={18} />}
              </button>

              {/* Camera Toggle & Flip for Video Calls */}
              {isVideoCall && (
                <>
                  <button
                    onClick={toggleVideo}
                    className={`p-3.5 rounded-full text-white transition-all ${videoOff ? "bg-red-500" : "bg-white/10 hover:bg-white/20"}`}
                    title={videoOff ? "Turn Camera On" : "Turn Camera Off"}
                  >
                    {videoOff ? <FaVideoSlash size={18} /> : <FaVideo size={18} />}
                  </button>
                  <button
                    onClick={switchCamera}
                    className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                    title="Switch Camera"
                  >
                    <FaSync size={16} />
                  </button>
                </>
              )}

              {/* End Call */}
              <button
                onClick={onEnd}
                className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                title="End Call"
              >
                <FaPhoneSlash size={20} />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
