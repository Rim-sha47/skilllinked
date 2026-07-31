import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPhone, FaVideo, FaMicrophone, FaMicrophoneSlash,
  FaVideoSlash, FaPhoneSlash, FaUsers, FaVolumeMute, FaVolumeUp,
} from "react-icons/fa";

const getUserName = (u) => u?.fullName || u?.name || u?.username || "User";
const getAvatar = (u) => {
  const p = u?.profilePicture || u?.avatar || null;
  return p === "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg" ? null : p;
};

// ─── Web Audio Ringtone (no file needed) ─────────────────────────────────────
const useRingtone = (playing) => {
  const audioCtxRef = useRef(null);
  const intervalRef = useRef(null);

  const playBeep = useCallback(() => {
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
        gain.gain.setValueAtTime(0.25, ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.13);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.14);
      });
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (playing) {
      playBeep();
      intervalRef.current = setInterval(playBeep, 2200);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, playBeep]);
};

// ─── Avatar with Ripple ───────────────────────────────────────────────────────
const CallerAvatar = ({ user, isGroup, chatName, pulse }) => {
  const COLORS = ["from-blue-500 to-indigo-700","from-purple-500 to-pink-600","from-emerald-500 to-teal-700","from-orange-500 to-red-600"];
  const name = isGroup ? (chatName || "Group") : getUserName(user);
  const avatarUrl = isGroup ? null : getAvatar(user);
  const colorIdx = (name?.charCodeAt(0) || 0) % COLORS.length;

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      {pulse && [0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2 border-white/25"
          style={{ width: `${144 + i * 52}px`, height: `${144 + i * 52}px` }}
          animate={{ scale: [1, 1.18, 1], opacity: [0.55, 0, 0.55] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.55, ease: "easeInOut" }}
        />
      ))}
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="w-36 h-36 rounded-full object-cover ring-4 ring-white/20 shadow-2xl z-10" />
      ) : (
        <div className={`w-36 h-36 rounded-full bg-gradient-to-br ${COLORS[colorIdx]} text-white flex items-center justify-center font-bold text-5xl shadow-2xl ring-4 ring-white/20 z-10`}>
          {isGroup ? <FaUsers size={44} /> : name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
};

// ─── Main Call Modal ──────────────────────────────────────────────────────────
export const CallModal = ({ callState, onAccept, onReject, onEnd, socket, currentUserId }) => {
  const { active, receiving, caller, type, accepted, isGroup, chatName } = callState;

  const [micMuted, setMicMuted]       = useState(false);
  const [videoOff, setVideoOff]       = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [hasRemote, setHasRemote]     = useState(false);
  const [mediaError, setMediaError]   = useState(null);

  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef        = useRef(null);
  const localStreamRef = useRef(null);
  const startTimeRef   = useRef(null);

  const isVisible   = active || receiving;
  const isRinging   = !accepted;
  const isVideoCall = type === "video";

  // Ringtone while not yet connected
  useRingtone(isVisible && !accepted);

  // ── Timer ──────────────────────────────────────────────────────────────────
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

  // ── WebRTC ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!active) {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
      peerRef.current?.close();
      peerRef.current = null;
      setHasRemote(false);
      setMicMuted(false);
      setVideoOff(false);
      setMediaError(null);
      return;
    }

    let pc;
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
          video: isVideoCall ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });
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

        // Signaling handlers
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

        // Caller creates offer when accepted
        if (!receiving && !isGroup && accepted) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket?.emit("call-offer", { to: caller?._id || caller, offer });
        }
      } catch (err) {
        setMediaError(
          err.name === "NotAllowedError"
            ? "Camera/Mic access denied — please allow permissions in browser."
            : `Device error: ${err.message}`
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
  }, [active, isVideoCall, accepted]);

  // Sync speaker mute
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

  const fmt = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`
      : `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  };

  const displayName = isGroup ? (chatName || "Group Call") : getUserName(caller);

  return (
    <AnimatePresence>
      <motion.div
        key="call-overlay"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[200] overflow-hidden flex flex-col"
      >
        {/* ── Background ──────────────────────────────────── */}
        {isVideoCall ? (
          <div className="absolute inset-0 bg-black">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            {!hasRemote && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)" }}>
                {/* Animated BG blobs */}
                {[0,1,2].map(i => (
                  <motion.div key={i} className="absolute rounded-full"
                    style={{ width: `${350+i*150}px`, height: `${350+i*150}px`,
                      background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
                      top:"50%", left:"50%", transform:"translate(-50%,-50%)" }}
                    animate={{ scale:[1,1.15,1], opacity:[0.4,0.1,0.4] }}
                    transition={{ duration: 3+i, repeat: Infinity, delay: i*0.7 }} />
                ))}
              </div>
            )}
            {/* PiP local */}
            <div className="absolute bottom-32 right-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-gray-900 z-20">
              <video ref={localVideoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${videoOff ? "hidden":""}`} />
              {videoOff && (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <FaVideoSlash size={20} className="text-gray-500" />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)" }}>
            {[0,1,2,3].map(i => (
              <motion.div key={i} className="absolute rounded-full"
                style={{ width:`${280+i*160}px`, height:`${280+i*160}px`,
                  background:"radial-gradient(circle, rgba(99,102,241,0.16) 0%, transparent 70%)",
                  top:"50%", left:"50%", transform:"translate(-50%,-50%)" }}
                animate={{ scale:[1,1.2,1], opacity:[0.4,0.08,0.4] }}
                transition={{ duration: 3+i*0.8, repeat: Infinity, delay: i*0.6 }} />
            ))}
          </div>
        )}

        {/* ── Content overlay ─────────────────────────────── */}
        <div className="relative z-10 flex flex-col h-full">

          {/* Top status pill */}
          <div className="flex justify-center pt-5">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${accepted ? "bg-green-400" : "bg-yellow-400 animate-pulse"}`} />
              <span className="text-white/80 text-xs font-medium">
                {isVideoCall ? "Video" : "Audio"} Call{isGroup ? " • Group" : ""}
              </span>
            </div>
          </div>

          {/* Center caller info */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Avatar (always for audio; only when no remote stream for video) */}
            {(!isVideoCall || !hasRemote) && (
              <motion.div initial={{ scale: 0.75, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-6">
                <CallerAvatar user={caller} isGroup={isGroup} chatName={chatName} pulse={isRinging} />
              </motion.div>
            )}

            <motion.h2 initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
              className="text-white font-bold text-2xl mb-3 drop-shadow-lg text-center px-6">
              {displayName}
            </motion.h2>

            {/* Status */}
            <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
              className="flex flex-col items-center gap-2">
              {accepted ? (
                <div className="flex items-center gap-2 bg-black/30 rounded-full px-5 py-2 backdrop-blur-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-white font-mono text-lg tracking-widest">{fmt(callDuration)}</span>
                </div>
              ) : receiving ? (
                <div className="flex items-center gap-2">
                  {[0,1,2].map(i => (
                    <motion.div key={i} className="w-2 h-2 rounded-full bg-blue-400"
                      animate={{ scale:[1,1.6,1], opacity:[0.5,1,0.5] }}
                      transition={{ duration:1, repeat:Infinity, delay:i*0.22 }} />
                  ))}
                  <span className="text-blue-300 text-sm font-medium ml-1">Incoming call…</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {[0,1,2].map(i => (
                    <motion.div key={i} className="w-2 h-2 rounded-full bg-white/50"
                      animate={{ scale:[1,1.6,1], opacity:[0.4,1,0.4] }}
                      transition={{ duration:1.3, repeat:Infinity, delay:i*0.3 }} />
                  ))}
                  <span className="text-white/60 text-sm ml-1">Ringing…</span>
                </div>
              )}
            </motion.div>

            {/* Media error */}
            {mediaError && (
              <div className="mt-5 mx-8 bg-red-500/25 border border-red-400/40 rounded-2xl px-5 py-3">
                <p className="text-red-300 text-xs text-center">{mediaError}</p>
              </div>
            )}
          </div>

          {/* ── Controls ──────────────────────────────────── */}
          <div className="pb-12 px-8">
            {receiving && !accepted ? (
              /* Incoming — decline / accept */
              <div className="flex items-center justify-center gap-20">
                <div className="flex flex-col items-center gap-2">
                  <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }} onClick={onReject}
                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-2xl">
                    <FaPhoneSlash size={22} />
                  </motion.button>
                  <span className="text-white/50 text-xs">Decline</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                    animate={{ y: [0, -7, 0] }} transition={{ duration: 0.8, repeat: Infinity }}
                    onClick={onAccept}
                    className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-2xl">
                    <FaPhone size={22} />
                  </motion.button>
                  <span className="text-white/50 text-xs">Accept</span>
                </div>
              </div>
            ) : (
              /* Active call controls */
              <div className="flex items-end justify-center gap-5 flex-wrap">
                {/* Mic */}
                <div className="flex flex-col items-center gap-1.5">
                  <motion.button whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.93 }} onClick={toggleMic}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-colors ${micMuted ? "bg-red-500/85" : "bg-white/15 backdrop-blur-sm"}`}>
                    {micMuted ? <FaMicrophoneSlash size={18} /> : <FaMicrophone size={18} />}
                  </motion.button>
                  <span className="text-white/45 text-[10px]">{micMuted ? "Unmute" : "Mute"}</span>
                </div>

                {/* Speaker */}
                <div className="flex flex-col items-center gap-1.5">
                  <motion.button whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.93 }} onClick={() => setSpeakerMuted(s => !s)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-colors ${speakerMuted ? "bg-red-500/85" : "bg-white/15 backdrop-blur-sm"}`}>
                    {speakerMuted ? <FaVolumeMute size={18} /> : <FaVolumeUp size={18} />}
                  </motion.button>
                  <span className="text-white/45 text-[10px]">Speaker</span>
                </div>

                {/* Camera (video only) */}
                {isVideoCall && (
                  <div className="flex flex-col items-center gap-1.5">
                    <motion.button whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.93 }} onClick={toggleVideo}
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-colors ${videoOff ? "bg-red-500/85" : "bg-white/15 backdrop-blur-sm"}`}>
                      {videoOff ? <FaVideoSlash size={18} /> : <FaVideo size={18} />}
                    </motion.button>
                    <span className="text-white/45 text-[10px]">{videoOff ? "Cam Off" : "Camera"}</span>
                  </div>
                )}

                {/* End */}
                <div className="flex flex-col items-center gap-1.5">
                  <motion.button whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.93 }} onClick={onEnd}
                    className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-2xl">
                    <FaPhoneSlash size={22} />
                  </motion.button>
                  <span className="text-white/45 text-[10px]">End</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
