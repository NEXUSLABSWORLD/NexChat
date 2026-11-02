import React, { useState } from 'react'
import { X, Users, Check } from 'lucide-react'

export default function GroupModal({ isOpen, onClose, contacts, onCreate }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState([])

  if (!isOpen) return null

  const handleToggleUser = (userId) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onCreate({ name, description, member_ids: selectedUserIds })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()} style={{ width: '450px' }}>
        <header className="settings-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={24} />
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Créer un groupe</h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </header>

        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nom du groupe *</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Ex: Famille, Amis..."
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Description</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Facultatif"
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ajouter des membres</label>
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {contacts.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Aucun contact disponible</p>
              ) : (
                contacts.map(contact => (
                  <div 
                    key={contact.id} 
                    onClick={() => handleToggleUser(contact.id)}
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                      padding: '8px', borderRadius: '8px', cursor: 'pointer',
                      background: selectedUserIds.includes(contact.id) ? 'rgba(255, 107, 107, 0.1)' : 'transparent',
                      border: '1px solid',
                      borderColor: selectedUserIds.includes(contact.id) ? '#FF6B6B' : 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="avatar" style={{ width: '32px', height: '32px' }}>
                        {contact.avatar_url ? (
                          <img src={contact.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                        ) : (
                          contact.username.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <span style={{ fontSize: '0.9rem' }}>{contact.username}</span>
                    </div>
                    {selectedUserIds.includes(contact.id) && <Check size={16} color="#FF6B6B" />}
                  </div>
                ))
              )}
            </div>
          </div>

          <button 
            type="submit" 
            style={{ 
              marginTop: '10px', padding: '12px', borderRadius: '8px', border: 'none', 
              background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)', 
              color: 'white', fontWeight: 'bold', cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Créer le groupe
          </button>
        </form>
      </div>
    </div>
  )
}
