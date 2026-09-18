import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Image as ImageIcon, Send, Clock, X, Smile } from 'lucide-react';
import { getPosts, createPost, toggleLike } from '../api/posts';
import { uploadFile } from '../api/storage';

export default function Feed({ currentUser }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
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

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await getPosts();
      setPosts(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        alert("Veuillez sélectionner une image valide.");
      }
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!content.trim() && !selectedImage) return;
    setIsPublishing(true);
    try {
      let mediaUrl = null;
      if (selectedImage) {
        const uploadResult = await uploadFile(selectedImage, currentUser.id);
        mediaUrl = uploadResult.file_url;
      }
      const newPost = await createPost(content, mediaUrl);
      setPosts([newPost, ...posts]);
      setContent('');
      removeImage();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la publication.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleLike = async (postId) => {
    // Optimistic update
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          is_liked: !p.is_liked,
          likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1
        };
      }
      return p;
    }));

    try {
      await toggleLike(postId);
    } catch (e) {
      console.error(e);
      // Revert if error
      fetchPosts();
    }
  };

  return (
    <div className="feed-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', background: 'var(--bg-panel)' }}>
      {/* Feed Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
          Publications
        </h1>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', width: '100%', padding: '20px' }}>
        {/* Composer */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px', marginBottom: '30px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div className="avatar no-story" style={{ width: '48px', height: '48px', flexShrink: 0 }}>
              <div className="avatar-inner" style={{ fontSize: '1.2rem' }}>
                {currentUser?.avatar_url 
                  ? <img src={currentUser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> 
                  : (currentUser?.username || 'U').substring(0,2).toUpperCase()}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <textarea 
                placeholder="Quoi de neuf aujourd'hui ?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{ width: '100%', minHeight: '80px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '1.05rem', resize: 'none', outline: 'none' }}
              />
              
              {previewUrl && (
                <div style={{ position: 'relative', marginTop: '10px', marginBottom: '10px', display: 'inline-block' }}>
                  <img src={previewUrl} alt="Preview" style={{ maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                  <button 
                    onClick={removeImage}
                    style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', fontWeight: 500 }} 
                    className="hover-glass"
                  >
                    <ImageIcon size={18} /> Joindre une image
                  </button>
                  <button 
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', fontWeight: 500 }} 
                    className="hover-glass"
                  >
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
                              setContent(prev => prev + emoji);
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
                  disabled={isPublishing || (!content.trim() && !selectedImage)}
                  style={{ background: 'var(--primary-color)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', cursor: isPublishing || (!content.trim() && !selectedImage) ? 'not-allowed' : 'pointer', padding: '10px 20px', borderRadius: '10px', fontWeight: 600, opacity: isPublishing || (!content.trim() && !selectedImage) ? 0.6 : 1, transition: 'all 0.2s' }}
                >
                  {isPublishing ? 'Publication...' : <><Send size={18} /> Publier</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Chargement des publications...</div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>Aucune publication</h3>
            <p>Soyez le premier à publier quelque chose !</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {posts.map(post => (
              <div key={post.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px', transition: 'transform 0.2s, box-shadow 0.2s' }} className="post-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div className="avatar no-story" style={{ width: '42px', height: '42px' }}>
                      <div className="avatar-inner" style={{ fontSize: '1rem' }}>
                        {post.user_avatar 
                          ? <img src={post.user_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> 
                          : (post.user_name || 'U').substring(0,2).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{post.user_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {new Date(post.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{ fontSize: '1.05rem', lineHeight: '1.6', color: 'var(--text-primary)', marginBottom: '15px', whiteSpace: 'pre-wrap' }}>
                  {post.content}
                </div>

                {post.media_url && (
                  <div style={{ marginBottom: '15px' }}>
                    <img 
                      src={post.media_url} 
                      alt="Publication media" 
                      style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.1)' }} 
                      loading="lazy"
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
                  <button 
                    onClick={() => handleLike(post.id)}
                    style={{ background: 'transparent', border: 'none', color: post.is_liked ? '#ef4444' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', transition: 'color 0.2s' }}
                  >
                    <Heart size={20} fill={post.is_liked ? '#ef4444' : 'none'} className={post.is_liked ? 'liked-animation' : ''} />
                    <span>{post.likes_count}</span>
                  </button>
                  <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                    <MessageCircle size={20} />
                    <span>Répondre</span>
                  </button>
                  <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', marginLeft: 'auto' }}>
                    <Share2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
