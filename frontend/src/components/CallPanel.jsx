import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from 'lucide-react'
import { getEcho } from '../api/echo'
import { sendCallSignal } from '../api/calls'

const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
}

export default function CallPanel({
  profile,
  conversationId,
  groupId,
  participantIds = [],
  onClose,
}) {
  const [phase, setPhase] = useState('idle')
  const [callType, setCallType] = useState('audio')
  const [incomingCall, setIncomingCall] = useState(null)
  const [muted, setMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [error, setError] = useState('')
  const [remoteStreams, setRemoteStreams] = useState([])
  const localStreamRef = useRef(null)
  const peersRef = useRef(new Map())
  const callIdRef = useRef(null)

  const scope = conversationId ? { conversationId } : { groupId }
  const channelName = conversationId ? `conversation.${conversationId}` : `group.${groupId}`

  const signal = useCallback((action, targetUserId, payload = {}, signalCallType = callType) => {
    return sendCallSignal({
      ...scope,
      callId: callIdRef.current,
      callType: signalCallType,
      action,
      targetUserId,
      payload,
    })
  }, [callType, conversationId, groupId])

  const stopStream = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop())
    localStreamRef.current = null
  }, [])

  const closeCall = useCallback(async (notify = true) => {
    if (notify && callIdRef.current) {
      await Promise.allSettled(
        [...peersRef.current.keys()].map((peerId) => signal('hangup', peerId)),
      )
    }
    peersRef.current.forEach((peer) => peer.close())
    peersRef.current.clear()
    stopStream()
    setRemoteStreams([])
    setIncomingCall(null)
    setPhase('idle')
    callIdRef.current = null
    onClose?.()
  }, [onClose, signal, stopStream])

  const createPeer = useCallback((peerId, initiator, activeCallType) => {
    if (peersRef.current.has(peerId)) return peersRef.current.get(peerId)

    const peer = new RTCPeerConnection(rtcConfig)
    localStreamRef.current?.getTracks().forEach((track) => peer.addTrack(track, localStreamRef.current))
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        signal('ice-candidate', peerId, { candidate: event.candidate.toJSON() }).catch(() => {})
      }
    }
    peer.ontrack = (event) => {
      const stream = event.streams[0]
      if (stream) {
        setRemoteStreams((current) => [
          ...current.filter((item) => item.peerId !== peerId),
          { peerId, stream },
        ])
      }
    }
    peersRef.current.set(peerId, peer)

    if (initiator) {
      peer.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: activeCallType === 'video' })
        .then((offer) => peer.setLocalDescription(offer).then(() => signal('offer', peerId, { description: peer.localDescription }, activeCallType)))
        .catch(() => setError('Impossible de démarrer la connexion audio/vidéo.'))
    }
    return peer
  }, [signal])

  const prepareMedia = useCallback(async (activeCallType) => {
    if (localStreamRef.current) return localStreamRef.current
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: activeCallType === 'video',
    })
    localStreamRef.current = stream
    return stream
  }, [])

  const startCall = async (activeCallType) => {
    try {
      setError('')
      setCallType(activeCallType)
      await prepareMedia(activeCallType)
      callIdRef.current = crypto.randomUUID()
      setPhase('outgoing')
      const peers = participantIds.filter((id) => id !== profile.id)
      peers.forEach((peerId) => createPeer(peerId, true, activeCallType))
    } catch {
      setError('Autorisez l’accès au microphone et à la caméra pour appeler.')
    }
  }

  useEffect(() => {
    if (!conversationId && !groupId) return undefined
    const echo = getEcho()
    const channel = echo.private(channelName)
    channel.listen('.call.signal', async (event) => {
      if (event.target_user_id && Number(event.target_user_id) !== Number(profile.id)) return

      if (event.action === 'hangup' || event.action === 'reject') {
        await closeCall(false)
        return
      }

      if (!callIdRef.current) {
        callIdRef.current = event.call_id
        setCallType(event.call_type)
      }
      if (callIdRef.current !== event.call_id) return

      try {
        if (event.action === 'offer') {
          setIncomingCall({
            callId: event.call_id,
            callerId: event.sender_user_id,
            callType: event.call_type,
            description: event.payload.description,
          })
          setPhase('incoming')
          return
        }
        const peer = peersRef.current.get(event.sender_user_id)
        if (event.action === 'answer' && peer) {
          await peer.setRemoteDescription(event.payload.description)
          setPhase('connected')
        } else if (event.action === 'ice-candidate' && peer && event.payload.candidate) {
          await peer.addIceCandidate(event.payload.candidate)
        }
      } catch {
        setError('La connexion de l’appel a échoué.')
      }
    })
    return () => echo.leave(channelName)
  }, [channelName, closeCall, conversationId, groupId, profile.id])

  const acceptCall = async () => {
    try {
      await prepareMedia(incomingCall.callType)
      const peer = createPeer(incomingCall.callerId, false, incomingCall.callType)
      await peer.setRemoteDescription(incomingCall.description)
      const answer = await peer.createAnswer()
      await peer.setLocalDescription(answer)
      await signal('answer', incomingCall.callerId, { description: peer.localDescription })
      setPhase('connected')
    } catch {
      setError('Impossible d’accepter cet appel.')
    }
  }

  useEffect(() => () => { closeCall(false) }, [closeCall])

  if (phase === 'idle' && !error) {
    return (
      <div style={{ display: 'flex', gap: 6 }}>
        <button type="button" title="Appel audio" onClick={() => startCall('audio')} style={buttonStyle}><Phone size={18} /></button>
        <button type="button" title="Appel vidéo" onClick={() => startCall('video')} style={buttonStyle}><Video size={18} /></button>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 2000, width: 320, background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 14, boxShadow: '0 15px 50px rgba(0,0,0,.45)' }}>
      <strong>{phase === 'incoming' ? 'Appel entrant' : phase === 'connected' ? 'Appel en cours' : 'Appel sortant...'}</strong>
      {error && <p style={{ color: '#ff8a8a', fontSize: 12 }}>{error}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginTop: 10 }}>
        {remoteStreams.map(({ peerId, stream }) => <RemoteVideo key={peerId} stream={stream} video={callType === 'video'} />)}
      </div>
      {localStreamRef.current && <LocalVideo stream={localStreamRef.current} video={callType === 'video'} />}
      {phase === 'incoming' ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button type="button" onClick={acceptCall} style={{ ...buttonStyle, background: '#22c55e' }}><Phone size={18} /></button>
          <button type="button" onClick={() => closeCall(true)} style={{ ...buttonStyle, background: '#ef4444' }}><PhoneOff size={18} /></button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button type="button" onClick={() => { localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = muted }); setMuted(!muted) }} style={buttonStyle}>{muted ? <MicOff size={18} /> : <Mic size={18} />}</button>
          {callType === 'video' && <button type="button" onClick={() => { localStreamRef.current?.getVideoTracks().forEach((track) => { track.enabled = cameraOff }); setCameraOff(!cameraOff) }} style={buttonStyle}>{cameraOff ? <VideoOff size={18} /> : <Video size={18} />}</button>}
          <button type="button" onClick={() => closeCall(true)} style={{ ...buttonStyle, background: '#ef4444' }}><PhoneOff size={18} /></button>
        </div>
      )}
    </div>
  )
}

function LocalVideo({ stream, video }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) ref.current.srcObject = stream }, [stream])
  return <video ref={ref} autoPlay muted playsInline style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 10, marginTop: 10 }} />
}

function RemoteVideo({ stream, video }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) ref.current.srcObject = stream }, [stream])
  return video
    ? <video ref={ref} autoPlay playsInline style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 10 }} />
    : <audio ref={ref} autoPlay style={{ width: '100%' }} />
}

const buttonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 34,
  height: 34,
  border: 'none',
  borderRadius: 9,
  background: 'var(--bg-message-out)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
}
