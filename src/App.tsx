import './App.css'
import { useEffect, useMemo, useState } from 'react'
import { useVoice } from '@humeai/voice-react'

function App() {
  const { connect, disconnect, status, lastUserMessage, lastVoiceMessage, sendUserInput } = useVoice()

  const handleConnect = async () => {
    try {
      await connect({
        auth: { type: 'apiKey', value: import.meta.env.VITE_HUME_API_KEY as string },
        configId: import.meta.env.VITE_HUME_CONFIG_ID as string,
      })
    } catch (error) {
      console.error('Failed to connect:', error)
    }
  }

  const isConnected = status.value === 'connected'

  type ChatItem = { role: 'user' | 'assistant'; text: string; time: Date }
  const [chat, setChat] = useState<ChatItem[]>([])

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null

  const extractText = (message: unknown): string => {
    if (!isRecord(message)) return ''

    const maybeMessage = message as Record<string, unknown>

    const inner = isRecord(maybeMessage.message) ? maybeMessage.message : undefined
    if (inner && typeof inner.content === 'string') {
      return inner.content
    }

    if (typeof maybeMessage.content === 'string') {
      return maybeMessage.content
    }

    if (typeof maybeMessage.text === 'string') {
      return maybeMessage.text
    }

    try {
      return JSON.stringify(message)
    } catch {
      return ''
    }
  }

  useEffect(() => {
    if (lastUserMessage) {
      setChat((prev) => [
        ...prev,
        { role: 'user', text: extractText(lastUserMessage), time: new Date() },
      ])
    }
  }, [lastUserMessage])

  useEffect(() => {
    if (lastVoiceMessage) {
      setChat((prev) => [
        ...prev,
        { role: 'assistant', text: extractText(lastVoiceMessage), time: new Date() },
      ])
    }
  }, [lastVoiceMessage])

  const [input, setInput] = useState('')
  const canSend = useMemo(() => isConnected && input.trim().length > 0, [isConnected, input])

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    sendUserInput(text)
    setInput('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', padding: 24, maxWidth: 800, margin: '0 auto', color: '#000' }}>
      <h1 style={{ color: '#fff' }}>Coachable</h1>
      <p style={{ color: '#fff' }}>Status: {status.value}{status.reason ? ` – ${status.reason}` : ''}</p>

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={handleConnect} disabled={isConnected}>
          Start Voice Chat
        </button>
        <button onClick={disconnect} disabled={!isConnected}>
          Stop Voice Chat
        </button>
      </div>

      <div style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: 12, height: 360, overflow: 'auto', background: '#fafafa' }}>
        {chat.length === 0 ? (
          <div style={{ color: '#000' }}>No messages yet.</div>
        ) : (
          chat.map((item, idx) => (
            <div key={idx} style={{ marginBottom: 10, color: '#000' }}>
              <div style={{ fontWeight: 600, color: '#000' }}>{item.role === 'user' ? 'You' : 'Assistant'}</div>
              <div style={{ whiteSpace: 'pre-wrap', color: '#000' }}>{item.text}</div>
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, width: '100%' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isConnected ? 'Type a message…' : 'Connect to start chatting'}
          disabled={!isConnected}
          style={{ flex: 1, padding: '10px 12px', borderRadius: 6, border: '1px solid #ccc', color: '#000' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canSend) handleSend()
          }}
        />
        <button onClick={handleSend} disabled={!canSend}>Send</button>
      </div>
    </div>
  )
}

export default App
