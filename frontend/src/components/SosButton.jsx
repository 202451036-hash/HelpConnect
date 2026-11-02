import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { requestApi } from '../api/client';
import { 
  Flame, 
  Droplets, 
  Globe, 
  Radio, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ShieldAlert, 
  ExternalLink,
  Loader2,
  PhoneCall,
  Volume2,
  VolumeX,
  MessageSquare,
  Copy,
  Check,
  Wifi,
  WifiOff,
  Send,
  Smartphone,
  ArrowLeft
} from 'lucide-react';

/**
 * Web Audio API synthesizer for emergency sound cues
 */
function playEmergencySound(frequency = 880, duration = 0.35, type = 'sine') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    // Beep-beep pattern
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio contexts may be blocked by autoplay policies
  }
}

export default function SosButton() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [address, setAddress] = useState('');
  const [sendingType, setSendingType] = useState(null); // 'water' | 'earth' | 'fire'
  const [activeSos, setActiveSos] = useState(null); // When an online SOS has been sent
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Offline SMS System States
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [forceOfflineSms, setForceOfflineSms] = useState(false);
  const [offlineSmsData, setOfflineSmsData] = useState(null);
  const [smsRecipient, setSmsRecipient] = useState('112');
  const [copied, setCopied] = useState(false);
  const [canFallbackToSms, setCanFallbackToSms] = useState(null);

  // Monitor network connectivity in real time
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Pre-fetch or retrieve location
  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      setCoords({ latitude: 23.2156, longitude: 72.6369 });
      setAddress('Gandhinagar Sector 4 (Default Zone)');
      return;
    }

    setGpsLoading(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ latitude: lat, longitude: lng });
        setGpsLoading(false);

        // Reverse geocoding attempt via free OpenStreetMap Nominatim
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
            headers: { 'Accept': 'application/json' }
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.display_name) {
              setAddress(data.display_name);
            } else {
              setAddress(`GPS Lat: ${lat.toFixed(5)}, Lon: ${lng.toFixed(5)}`);
            }
          }
        } catch {
          setAddress(`GPS Lat: ${lat.toFixed(5)}, Lon: ${lng.toFixed(5)}`);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setGpsError('Unable to get exact GPS coordinates automatically. Fallback coordinates applied.');
        setCoords({ latitude: 23.2156, longitude: 72.6369 });
        setAddress('Sector 4, Gandhinagar Emergency Sector');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );
  };

  // Pre-fetch location whenever the panel is opened
  useEffect(() => {
    if (isOpen && !coords) {
      fetchLocation();
    }
  }, [isOpen]);

  // Generate offline SMS payload and view
  const generateOfflineSms = (type) => {
    const lat = coords?.latitude || 23.2156;
    const lng = coords?.longitude || 72.6369;
    const name = user?.name || 'Affected Survivor (Offline SOS)';
    const phone = user?.contactNumber || user?.phone || user?.email || 'Emergency Signal';
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let categoryTitle = 'Water Crisis / Floods';
    if (type === 'earth') categoryTitle = 'Earthquake / Collapse';
    if (type === 'fire') categoryTitle = 'Fire Disaster / Blaze';

    const compactCode = `HC#SOS#${type.toUpperCase()}#${lat.toFixed(5)},${lng.toFixed(5)}#${name}#${phone}`;
    const humanText = `🚨 HELPCONNECT EMERGENCY SOS!
CATEGORY: ${categoryTitle.toUpperCase()}
NAME: ${name}
PHONE: ${phone}
GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}
MAP: https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}
TIME: ${timeStr}
CODE: ${compactCode}
Please dispatch rescue units immediately!`;

    if (soundEnabled) {
      playEmergencySound(950, 0.4, 'sawtooth');
      setTimeout(() => playEmergencySound(1150, 0.4, 'sawtooth'), 250);
    }

    setOfflineSmsData({
      type,
      categoryTitle,
      lat,
      lng,
      name,
      phone,
      timeStr,
      compactCode,
      humanText
    });
    setErrorMsg('');
    setCanFallbackToSms(null);
  };

  // Copy SMS text to clipboard
  const handleCopySms = (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  // Handle triggering SOS for chosen emergency disaster symbol
  const handleTriggerSos = async (type) => {
    setErrorMsg('');
    setCanFallbackToSms(null);

    // If offline or forced SMS mode is selected
    if (!isOnline || forceOfflineSms) {
      generateOfflineSms(type);
      return;
    }

    setSendingType(type);

    if (soundEnabled) {
      playEmergencySound(950, 0.4, 'sawtooth');
      setTimeout(() => playEmergencySound(1150, 0.4, 'sawtooth'), 250);
    }

    const lat = coords?.latitude || 23.2156;
    const lng = coords?.longitude || 72.6369;
    const finalAddr = address || `GPS Coordinates: [${lat.toFixed(5)}, ${lng.toFixed(5)}]`;

    try {
      const payload = {
        sosType: type,
        latitude: lat,
        longitude: lng,
        address: finalAddr,
        requesterName: user?.name || 'Affected Survivor (Quick SOS)',
        contactNumber: user?.email || 'Emergency Dispatch Radio'
      };

      const res = await requestApi.sendSos(payload);
      if (res && res.request) {
        setActiveSos(res.request);
        if (soundEnabled) {
          setTimeout(() => playEmergencySound(750, 0.3, 'sine'), 500);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Network connection failed. Could not reach cloud servers.');
      setCanFallbackToSms(type);
    } finally {
      setSendingType(null);
    }
  };

  return (
    <>
      {/* Floating Corner SOS Button */}
      <div 
        className="sos-corner-container"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px'
        }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Emergency SOS Beacon"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.9rem 1.4rem',
            backgroundColor: '#dc2626',
            color: '#ffffff',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            borderRadius: '9999px',
            boxShadow: '0 0 25px rgba(220, 38, 38, 0.75), 0 8px 20px rgba(0, 0, 0, 0.6)',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '1rem',
            letterSpacing: '0.06em',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isOpen ? 'scale(0.96)' : 'scale(1)',
          }}
          className="sos-pulse-btn"
        >
          <span 
            style={{
              position: 'absolute',
              top: '-4px',
              left: '-4px',
              right: '-4px',
              bottom: '-4px',
              borderRadius: '9999px',
              border: '2px solid #ef4444',
              animation: 'ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite',
              pointerEvents: 'none'
            }}
          />
          <Radio size={22} className="animate-pulse" />
          <span>SOS HELP</span>
        </button>
      </div>

      {/* SOS Panel / Modal */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !activeSos) {
              setIsOpen(false);
            }
          }}
        >
          <div 
            style={{
              backgroundColor: '#111827',
              border: '2px solid #ef4444',
              borderRadius: '1.25rem',
              boxShadow: '0 0 50px rgba(239, 68, 68, 0.45), 0 20px 40px rgba(0,0,0,0.8)',
              width: '100%',
              maxWidth: '560px',
              overflow: 'hidden',
              animation: 'slideUp 0.3s ease-out'
            }}
          >
            {/* Header */}
            <div 
              style={{
                background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.3) 0%, rgba(17, 24, 39, 0.9) 100%)',
                borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div 
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(239, 68, 68, 0.25)',
                    border: '1px solid #ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ef4444'
                  }}
                >
                  <ShieldAlert size={24} className="animate-pulse" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc', fontWeight: 800, letterSpacing: '0.02em' }}>
                    EMERGENCY DISTRESS BEACON
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#fca5a5' }}>
                    Instant 1-Click SOS Dispatch with Your Exact GPS Location
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? "Mute alert audio" : "Enable alert audio"}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: soundEnabled ? '#38bdf8' : 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '6px'
                  }}
                >
                  {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: '#f8fafc',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* If an active SOS has just been dispatched */}
              {activeSos ? (
                <div 
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <div 
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      border: '2px solid #10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#34d399'
                    }}
                  >
                    <CheckCircle2 size={36} />
                  </div>

                  <div>
                    <h4 style={{ fontSize: '1.35rem', color: '#f8fafc', marginBottom: '0.25rem' }}>
                      SOS SIGNAL BROADCASTED TO ADMIN
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: '#a7f3d0' }}>
                      Help is being mobilized! Responders and command admins have received your emergency coordinates.
                    </p>
                  </div>

                  <div 
                    style={{
                      width: '100%',
                      backgroundColor: '#1f2937',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      textAlign: 'left',
                      fontSize: '0.85rem',
                      color: '#e5e7eb',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                  >
                    <div><strong>Emergency Category:</strong> {activeSos.sosSymbol || activeSos.assistanceType}</div>
                    <div><strong>Broadcasted Location:</strong> {activeSos.location?.address}</div>
                    <div><strong>Coordinates:</strong> {activeSos.location?.latitude?.toFixed(5)}° N, {activeSos.location?.longitude?.toFixed(5)}° E</div>
                    <div><strong>Status:</strong> <span style={{ color: '#fbbf24', fontWeight: 600 }}>PRIORITY ESCALATED (Critical)</span></div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                    <a
                      href={`https://www.google.com/maps?q=${activeSos.location?.latitude},${activeSos.location?.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline"
                      style={{ flex: 1, textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                    >
                      <MapPin size={16} /> View on Map <ExternalLink size={14} />
                    </a>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      onClick={() => {
                        setActiveSos(null);
                        setIsOpen(false);
                      }}
                    >
                      Dismiss Beacon
                    </button>
                  </div>
                </div>
              ) : offlineSmsData ? (
                /* Dedicated Offline SMS Dispatch View */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setOfflineSmsData(null)}
                      className="btn btn-outline btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                    >
                      <ArrowLeft size={14} /> Back to SOS Menu
                    </button>
                    <span 
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.25rem 0.65rem', 
                        borderRadius: '9999px',
                        backgroundColor: 'rgba(249, 115, 22, 0.2)',
                        color: '#fb923c',
                        border: '1px solid rgba(249, 115, 22, 0.4)',
                        fontWeight: 700
                      }}
                    >
                      📡 OFFLINE CELLULAR SMS BEACON
                    </span>
                  </div>

                  <div 
                    style={{
                      background: 'rgba(249, 115, 22, 0.08)',
                      border: '1px solid rgba(249, 115, 22, 0.35)',
                      borderRadius: '0.75rem',
                      padding: '0.85rem 1rem',
                      fontSize: '0.85rem',
                      color: '#fed7aa',
                      lineHeight: 1.45
                    }}
                  >
                    <strong>No Internet Connection Required:</strong> Your device has locked your exact hardware GPS coordinates. Tap below to transmit this pre-filled emergency distress beacon directly via standard cellular SMS.
                  </div>

                  {/* Recipient Selector */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      Target Emergency Hotline / SMS Recipient:
                    </label>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {[
                        { label: '112 (National All-Emergency)', val: '112' },
                        { label: '1078 (Disaster / NDRF)', val: '1078' },
                        { label: '108 (Ambulance)', val: '108' }
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setSmsRecipient(item.val)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '0.5rem',
                            border: smsRecipient === item.val ? '1px solid #f97316' : '1px solid var(--border-subtle)',
                            background: smsRecipient === item.val ? 'rgba(249, 115, 22, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                            color: smsRecipient === item.val ? '#fb923c' : 'var(--text-secondary)',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            fontWeight: smsRecipient === item.val ? 700 : 500
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <div style={{ marginTop: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Or enter custom emergency / rescuer phone..."
                        value={smsRecipient}
                        onChange={(e) => setSmsRecipient(e.target.value)}
                        className="form-input"
                        style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}
                      />
                    </div>
                  </div>

                  {/* Generated SMS Text Box */}
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Generated SMS Distress Payload:</span>
                      <button
                        type="button"
                        onClick={() => handleCopySms(offlineSmsData.humanText)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: copied ? '#34d399' : '#38bdf8',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'Copied to Clipboard!' : 'Copy SMS'}
                      </button>
                    </div>
                    <pre
                      style={{
                        margin: 0,
                        padding: '0.85rem 1rem',
                        backgroundColor: '#090d16',
                        border: '1px solid rgba(249, 115, 22, 0.4)',
                        borderRadius: '0.65rem',
                        color: '#f8fafc',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        lineHeight: 1.45,
                        maxHeight: '140px',
                        overflowY: 'auto'
                      }}
                    >
                      {offlineSmsData.humanText}
                    </pre>
                  </div>

                  {/* Primary Dispatch Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <a
                      href={`sms:${smsRecipient}?body=${encodeURIComponent(offlineSmsData.humanText)}`}
                      className="btn btn-primary"
                      style={{
                        backgroundColor: '#ea580c',
                        borderColor: '#f97316',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        textDecoration: 'none',
                        padding: '0.85rem 1rem',
                        fontSize: '1rem',
                        fontWeight: 800,
                        boxShadow: '0 0 20px rgba(234, 88, 12, 0.4)'
                      }}
                    >
                      <Smartphone size={20} />
                      📱 Open Native SMS App (Auto-Prefill & Send)
                    </a>

                    <div style={{ display: 'flex', gap: '0.65rem' }}>
                      <button
                        type="button"
                        onClick={() => handleCopySms(offlineSmsData.humanText)}
                        className="btn btn-outline"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                      >
                        <Copy size={16} /> Copy Text
                      </button>
                      <a
                        href={`tel:${smsRecipient}`}
                        className="btn btn-outline"
                        style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                      >
                        <PhoneCall size={16} /> Call Direct ({smsRecipient})
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Network Connectivity Status Bar */}
                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: (!isOnline || forceOfflineSms) ? 'rgba(249, 115, 22, 0.12)' : 'rgba(16, 185, 129, 0.1)',
                      border: (!isOnline || forceOfflineSms) ? '1px solid rgba(249, 115, 22, 0.35)' : '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '0.65rem',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {(!isOnline || forceOfflineSms) ? (
                        <>
                          <WifiOff size={15} style={{ color: '#fb923c' }} />
                          <span style={{ color: '#fed7aa', fontWeight: 600 }}>
                            {forceOfflineSms ? 'Forced Offline SMS Mode' : 'Network Disconnected (Offline SMS Ready)'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Wifi size={15} style={{ color: '#34d399' }} />
                          <span style={{ color: '#a7f3d0', fontWeight: 600 }}>
                            Online: Cloud SOS Dispatch Ready
                          </span>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setForceOfflineSms(!forceOfflineSms)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: (!isOnline || forceOfflineSms) ? '#38bdf8' : '#fb923c',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        textDecoration: 'underline',
                        fontWeight: 600
                      }}
                    >
                      {forceOfflineSms ? 'Switch to Online Mode' : 'Test / Switch to Offline SMS'}
                    </button>
                  </div>

                  {/* Instructions */}
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {(!isOnline || forceOfflineSms) 
                      ? 'Select your emergency situation to generate an instant, GPS-locked SMS distress beacon to send without internet:'
                      : 'Tap the disaster icon matching your life-safety situation below. An immediate emergency signal with your live coordinates will be transmitted to emergency dispatch:'}
                  </div>

                  {/* 3 Disaster Emergency Symbols */}
                  <div 
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '1rem'
                    }}
                  >
                    {/* Symbol 1: Water */}
                    <button
                      type="button"
                      disabled={!!sendingType}
                      onClick={() => handleTriggerSos('water')}
                      style={{
                        backgroundColor: 'rgba(2, 132, 199, 0.12)',
                        border: '2px solid #0284c7',
                        borderRadius: '1rem',
                        padding: '1.25rem 1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: sendingType ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        color: '#f8fafc',
                        textAlign: 'center',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(2, 132, 199, 0.25)';
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 0 25px rgba(2, 132, 199, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(2, 132, 199, 0.12)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div 
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(2, 132, 199, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#38bdf8'
                        }}
                      >
                        <Droplets size={32} />
                      </div>
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>WATER</div>
                        <div style={{ fontSize: '0.75rem', color: '#93c5fd', marginTop: '2px' }}>
                          Water Crisis / Floods
                        </div>
                      </div>
                      {sendingType === 'water' && (
                        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Loader2 size={24} className="animate-spin" color="#38bdf8" />
                        </div>
                      )}
                    </button>

                    {/* Symbol 2: Earth */}
                    <button
                      type="button"
                      disabled={!!sendingType}
                      onClick={() => handleTriggerSos('earth')}
                      style={{
                        backgroundColor: 'rgba(217, 119, 6, 0.12)',
                        border: '2px solid #d97706',
                        borderRadius: '1rem',
                        padding: '1.25rem 1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: sendingType ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        color: '#f8fafc',
                        textAlign: 'center',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(217, 119, 6, 0.25)';
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 0 25px rgba(217, 119, 6, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(217, 119, 6, 0.12)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div 
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(217, 119, 6, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fbbf24'
                        }}
                      >
                        <Globe size={32} />
                      </div>
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24' }}>EARTH</div>
                        <div style={{ fontSize: '0.75rem', color: '#fde68a', marginTop: '2px' }}>
                          Earthquake / Collapse
                        </div>
                      </div>
                      {sendingType === 'earth' && (
                        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Loader2 size={24} className="animate-spin" color="#fbbf24" />
                        </div>
                      )}
                    </button>

                    {/* Symbol 3: Fire */}
                    <button
                      type="button"
                      disabled={!!sendingType}
                      onClick={() => handleTriggerSos('fire')}
                      style={{
                        backgroundColor: 'rgba(220, 38, 38, 0.12)',
                        border: '2px solid #dc2626',
                        borderRadius: '1rem',
                        padding: '1.25rem 1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: sendingType ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        color: '#f8fafc',
                        textAlign: 'center',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.25)';
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 0 25px rgba(220, 38, 38, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(220, 38, 0.12)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div 
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(220, 38, 38, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#f87171'
                        }}
                      >
                        <Flame size={32} />
                      </div>
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f87171' }}>FIRE</div>
                        <div style={{ fontSize: '0.75rem', color: '#fca5a5', marginTop: '2px' }}>
                          Fire Disaster / Blaze
                        </div>
                      </div>
                      {sendingType === 'fire' && (
                        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Loader2 size={24} className="animate-spin" color="#f87171" />
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Fallback to Offline SMS Prompt if network error occurred */}
                  {canFallbackToSms && (
                    <div style={{
                      backgroundColor: 'rgba(249, 115, 22, 0.18)',
                      border: '1px solid #f97316',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fb923c', fontWeight: 700, fontSize: '0.9rem' }}>
                        <AlertTriangle size={18} />
                        Network Interrupted: Dispatch via Offline SMS
                      </div>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#fed7aa' }}>
                        Internet servers could not be contacted. You can dispatch this exact alert immediately via 2G/GSM cellular SMS with your live GPS location:
                      </p>
                      <button
                        type="button"
                        onClick={() => generateOfflineSms(canFallbackToSms)}
                        className="btn btn-primary"
                        style={{
                          backgroundColor: '#ea580c',
                          borderColor: '#f97316',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          padding: '0.6rem 1rem'
                        }}
                      >
                        <MessageSquare size={16} />
                        Generate Offline SMS for {canFallbackToSms.toUpperCase()}
                      </button>
                    </div>
                  )}

                  {errorMsg && !canFallbackToSms && (
                    <div style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid #ef4444',
                      color: '#fca5a5',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.85rem'
                    }}>
                      {errorMsg}
                    </div>
                  )}

                  {/* Geolocation Telemetry Footer */}
                  <div 
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '0.75rem',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={16} style={{ color: '#38bdf8' }} />
                      <span>
                        {gpsLoading ? (
                          'Acquiring precise satellite GPS coordinates...'
                        ) : coords ? (
                          <>
                            <strong>GPS Locked:</strong> {coords.latitude.toFixed(5)}° N, {coords.longitude.toFixed(5)}° E
                          </>
                        ) : (
                          'Detecting current coordinates...'
                        )}
                      </span>
                    </div>

                    <button 
                      type="button"
                      onClick={fetchLocation}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#38bdf8',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        textDecoration: 'underline'
                      }}
                    >
                      Refresh GPS
                    </button>
                  </div>

                  {/* Emergency Helpline Backup */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Emergency Services: <strong>112</strong> / NDRF: <strong>1078</strong></span>
                    <button
                      type="button"
                      onClick={() => generateOfflineSms('water')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fb923c',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        textDecoration: 'underline'
                      }}
                    >
                      Open SMS Generator Directly &rarr;
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for the pulsing beacon effect */}
      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .sos-pulse-btn:hover {
          transform: scale(1.05) !important;
          box-shadow: 0 0 35px rgba(220, 38, 38, 0.9), 0 10px 25px rgba(0, 0, 0, 0.8) !important;
        }
      `}</style>
    </>
  );
}
