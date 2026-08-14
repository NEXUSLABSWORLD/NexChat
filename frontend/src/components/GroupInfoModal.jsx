import React, { useState } from 'react'
import { X, Users, UserPlus, Shield, UserMinus, ShieldAlert } from 'lucide-react'

export default function GroupInfoModal({ 
  isOpen, 
  onClose, 
  group, 
  currentUser, 
  contacts, 
  onAddMember, 
  onRemoveMember, 
  onSetRole 
}) {
  const [showAddMember, setShowAddMember] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState([])

  if (!isOpen || !group) return null

  // Trouver le rôle de l'utilisateur actuel dans ce groupe
  const currentMember = group.members?.find(m => m.user_id === currentUser?.id)
  const isAdmin = currentMember?.role === 'admin'

  // Filtrer les contacts pour ne garder que ceux qui ne sont pas déjà dans le groupe
  const existingMemberIds = group.members?.map(m => m.user_id) || []
  const availableContacts = contacts.filter(c => !existingMemberIds.includes(c.id))

  const handleToggleUser = (userId) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const handleAddMembers = () => {
    selectedUserIds.forEach(userId => {
      onAddMember(group.id, userId)
    })
    setShowAddMember(false)
    setSelectedUserIds([])
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="settings-modal" onClick={e => e.stopPropagation()} style={{ width: '450px', maxHeight: '80vh', overflowY: 'auto' }}>
        <header className="settings-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 10, paddingBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={24} />
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Infos du groupe</h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </header>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          {/* Group Header Info */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div className="avatar" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
              {group.avatar_url ? (
                <img src={group.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                group.name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
              )}
            </div>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{group.name}</h3>
            {group.description && <p style={{ margin: 0, color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem' }}>{group.description}</p>}
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '5px 10px', borderRadius: '20px' }}>
              {group.members?.length || 0} membre{(group.members?.length || 0) > 1 ? 's' : ''}
            </span>
          </div>

          {/* Add Members Section */}
          {isAdmin && (
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
              {!showAddMember ? (
                <button 
                  onClick={() => setShowAddMember(true)}
                  style={{ 
                    width: '100%', padding: '12px', borderRadius: '8px', border: '1px dashed var(--border-glass)', 
                    background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-primary)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                >
                  <UserPlus size={18} /> Ajouter des membres
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Sélectionner des contacts</h4>
                  <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {availableContacts.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Aucun contact disponible</p>
                    ) : (
                      availableContacts.map(contact => (
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
                        </div>
                      ))
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => { setShowAddMember(false); setSelectedUserIds([]); }}
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}
                    >
                      Annuler
                    </button>
                    <button 
                      onClick={handleAddMembers}
                      disabled={selectedUserIds.length === 0}
                      style={{ 
                        flex: 1, padding: '10px', borderRadius: '8px', border: 'none', 
                        background: selectedUserIds.length > 0 ? 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)' : 'rgba(255,255,255,0.1)', 
                        color: 'white', cursor: selectedUserIds.length > 0 ? 'pointer' : 'not-allowed'
                      }}
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Members List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>Membres ({group.members?.length || 0})</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {group.members?.map(member => {
                const isMe = member.user_id === currentUser?.id
                const isMemberAdmin = member.role === 'admin'
                
                return (
                  <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="avatar" style={{ width: '36px', height: '36px' }}>
                        {member.user?.avatar_url ? (
                          <img src={member.user.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                        ) : (
                          (member.user?.username || '?').slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>
                          {member.user?.username} {isMe && <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 'normal' }}>(Vous)</span>}
                        </span>
                        {isMemberAdmin && (
                          <span style={{ fontSize: '0.7rem', color: '#FF6B6B', background: 'rgba(255, 107, 107, 0.1)', padding: '2px 6px', borderRadius: '4px', alignSelf: 'flex-start', marginTop: '2px' }}>
                            Admin
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Admin Actions Dropdown (Simulé avec des petits boutons pour l'instant) */}
                    {isAdmin && !isMe && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {isMemberAdmin ? (
                          <button 
                            onClick={() => onSetRole(group.id, member.user_id, 'member')}
                            title="Retirer les droits d'admin"
                            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-secondary)' }}
                          >
                            <ShieldAlert size={16} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => onSetRole(group.id, member.user_id, 'admin')}
                            title="Nommer Admin"
                            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#22c55e' }}
                          >
                            <Shield size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => onRemoveMember(group.id, member.user_id)}
                          title="Retirer du groupe"
                          style={{ background: 'rgba(255, 107, 107, 0.1)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#FF6B6B' }}
                        >
                          <UserMinus size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
