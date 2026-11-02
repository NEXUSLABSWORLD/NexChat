import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Image as ImageIcon, Send, ChevronLeft, ChevronRight, Smile } from 'lucide-react';
import { getStories, createStory } from '../api/stories';
import { uploadFile } from '../api/storage';

export default function StoriesTray({ currentUser }) {
  const [groupedStories, setGroupedStories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create Story State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);

  const orangeHeadEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', 
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', 
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', 
    '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', 
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', 
    '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', 
    '🤔', '🫣', '🤭', '🫢', '🫡', '🤫', '🫠', '😐', '😑', '😬', 
    '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', 
    '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'
  ];

  // View Story State
  const [activeUserIndex, setActiveUserIndex] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const data = await getStories();
      setGroupedStories(data || []);
    } catch (e) {
      console.error('Failed to fetch stories:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handlePublish = async () => {
    if (!textContent.trim() && !selectedImage) return;
    setIsPublishing(true);
    try {
      let mediaUrl = null;
      if (selectedImage) {
        const uploadResult = await uploadFile(selectedImage, currentUser.id);
        mediaUrl = uploadResult.file_url;
      }
      await createStory(textContent, mediaUrl);
      setShowCreateModal(false);
      setTextContent('');
      setSelectedImage(null);
      setPreviewUrl(null);
      fetchStories(); // Refresh stories
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la publication du statut.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleViewStory = (userIndex) => {
    setActiveUserIndex(userIndex);
    setActiveStoryIndex(0);
  };

  const nextStory = () => {
    if (activeUserIndex === null) return;
    const userStories = groupedStories[activeUserIndex].stories;
    if (activeStoryIndex < userStories.length - 1) {
      setActiveStoryIndex(prev => prev + 1);
    } else {
      // Go to next user
      if (activeUserIndex < groupedStories.length - 1) {
        setActiveUserIndex(prev => prev + 1);
        setActiveStoryIndex(0);
      } else {
        closeStoryViewer();
      }
    }
  };

  const prevStory = () => {
    if (activeUserIndex === null) return;
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(prev => prev - 1);
    } else {
      // Go to previous user
      if (activeUserIndex > 0) {
        setActiveUserIndex(prev => prev - 1);
        const prevUserStories = groupedStories[activeUserIndex - 1].stories;
        setActiveStoryIndex(prevUserStories.length - 1);
      }
    }
  };

  const closeStoryViewer = () => {
    setActiveUserIndex(null);
    setActiveStoryIndex(0);
  };

  // Auto-advance story timer
  useEffect(() => {
    let timer;
    if (activeUserIndex !== null) {
      timer = setTimeout(() => {
        nextStory();
      }, 5000); // 5 seconds per story
    }
    return () => clearTimeout(timer);
  }, [activeUserIndex, activeStoryIndex, groupedStories]);

  return (
    <div className="stories-tray" style={{ display: 'flex', gap: '15px', overflowX: 'auto', padding: '15px 20px', borderBottom: '1px solid var(--border-color)', scrollbarWidth: 'none' }}>
      {/* Current User: Add Story */}
      <div 
        className="story-item" 
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }}
        onClick={() => setShowCreateModal(true)}
      >
        <div style={{ position: 'relative', width: '56px', height: '56px' }}>
          <div className="avatar no-story" style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2px solid var(--border-color)', padding: '2px', background: 'var(--bg-panel)' }}>
            <div className="avatar-inner" style={{ fontSize: '1.2rem', width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
              {currentUser?.avatar_url 
                ? <img src={currentUser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> 
                : (currentUser?.username || 'U').substring(0,2).toUpperCase()}
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: 'var(--primary-color)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-panel)' }}>
            <Plus size={14} strokeWidth={3} />
          </div>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Mon statut</span>
      </div>

      {/* Other Users' Stories */}
      {!loading && groupedStories.map((group, index) => (
        <div 
          key={group.user_id} 
          className="story-item" 
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }}
          onClick={() => handleViewStory(index)}
        >
          <div className="avatar" style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid var(--primary-color)', padding: '2px', background: 'var(--bg-panel)' }}>
            <div className="avatar-inner" style={{ fontSize: '1.2rem', width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
              {group.user_avatar 
                ? <img src={group.user_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> 
                : (group.user_name || 'U').substring(0,2).toUpperCase()}
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 500, maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {group.user_name}
          </span>
        </div>
      ))}

      {/* CREATE STORY MODAL */}
      {showCreateModal && (
        <div className="modal-overlay" style={{ zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="settings-modal" style={{ width: '400px', background: 'var(--bg-panel)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem' }}>Créer un statut</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '20px' }}>
              <textarea 
                placeholder="Tapez un statut..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                style={{ width: '100%', minHeight: '100px', background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '10px', color: 'white', padding: '15px', fontSize: '1.1rem', resize: 'none', outline: 'none', marginBottom: '15px' }}
              />
              
              {previewUrl && (
                <div style={{ position: 'relative', marginBottom: '15px' }}>
                  <img src={previewUrl} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '10px' }} />
                  <button onClick={() => { setSelectedImage(null); setPreviewUrl(null); }} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}>
                    <X size={16} />
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" style={{ display: 'none' }} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => fileInputRef.current?.click()} style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500 }}>
                    <ImageIcon size={18} /> Photo
                  </button>
                  <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500 }}>
                    <Smile size={18} /> Emojis
                  </button>
                </div>

                {showEmojiPicker && (
                  <>
                    <div onClick={() => setShowEmojiPicker(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 49 }} />
                    <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: '10px', zIndex: 50, background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '10px', width: '280px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', maxHeight: '200px', overflowY: 'auto' }}>
                        {orangeHeadEmojis.map((emoji, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => {
                              setTextContent(prev => prev + emoji);
                              setShowEmojiPicker(false);
                            }}
                            style={{ background: 'transparent', border: 'none', fontSize: '1.3rem', cursor: 'pointer', padding: '5px', borderRadius: '5px' }}
                            className="hover-glass"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <button 
                  onClick={handlePublish}
                  disabled={isPublishing || (!textContent.trim() && !selectedImage)}
                  style={{ background: 'var(--primary-color)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', cursor: isPublishing || (!textContent.trim() && !selectedImage) ? 'not-allowed' : 'pointer', padding: '10px 20px', borderRadius: '10px', fontWeight: 600, opacity: isPublishing || (!textContent.trim() && !selectedImage) ? 0.6 : 1 }}
                >
                  {isPublishing ? 'Envoi...' : <><Send size={18} /> Publier</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW STORY MODAL */}
      {activeUserIndex !== null && groupedStories[activeUserIndex] && (
        <div className="modal-overlay" style={{ zIndex: 4000, background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          
          {/* Top Bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div className="avatar no-story" style={{ width: '40px', height: '40px' }}>
                <div className="avatar-inner" style={{ fontSize: '1rem' }}>
                  {groupedStories[activeUserIndex].user_avatar 
                    ? <img src={groupedStories[activeUserIndex].user_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> 
                    : (groupedStories[activeUserIndex].user_name || 'U').substring(0,2).toUpperCase()}
                </div>
              </div>
              <div style={{ color: 'white', fontWeight: 600, fontSize: '1.1rem', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                {groupedStories[activeUserIndex].user_name}
              </div>
            </div>
            <button onClick={closeStoryViewer} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '10px' }}>
              <X size={30} />
            </button>
          </div>

          {/* Progress Bars */}
          <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', display: 'flex', gap: '5px', zIndex: 10 }}>
            {groupedStories[activeUserIndex].stories.map((_, idx) => (
              <div key={idx} style={{ height: '3px', flex: 1, background: idx < activeStoryIndex ? 'white' : idx === activeStoryIndex ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)', borderRadius: '3px' }}>
                {idx === activeStoryIndex && (
                  <div style={{ height: '100%', background: 'white', borderRadius: '3px', animation: 'storyProgress 5s linear forwards' }} />
                )}
              </div>
            ))}
          </div>

          <style>{`@keyframes storyProgress { from { width: 0%; } to { width: 100%; } }`}</style>

          {/* Navigation Overlay */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '30%', zIndex: 5, cursor: 'w-resize' }} onClick={prevStory} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '30%', zIndex: 5, cursor: 'e-resize' }} onClick={nextStory} />

          {/* Story Content */}
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {groupedStories[activeUserIndex].stories[activeStoryIndex].media_url && (
              <img 
                src={groupedStories[activeUserIndex].stories[activeStoryIndex].media_url} 
                alt="Story media" 
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
              />
            )}
            {groupedStories[activeUserIndex].stories[activeStoryIndex].text_content && (
              <div style={{ 
                position: groupedStories[activeUserIndex].stories[activeStoryIndex].media_url ? 'absolute' : 'relative', 
                bottom: groupedStories[activeUserIndex].stories[activeStoryIndex].media_url ? '10%' : 'auto', 
                background: groupedStories[activeUserIndex].stories[activeStoryIndex].media_url ? 'rgba(0,0,0,0.6)' : 'transparent', 
                padding: '20px 40px', 
                borderRadius: '16px', 
                color: 'white', 
                fontSize: groupedStories[activeUserIndex].stories[activeStoryIndex].media_url ? '1.5rem' : '2.5rem', 
                textAlign: 'center', 
                maxWidth: '80%', 
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                fontFamily: 'Space Grotesk'
              }}>
                {groupedStories[activeUserIndex].stories[activeStoryIndex].text_content}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
