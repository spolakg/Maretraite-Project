import React, { useState } from 'react';
import { 
  Heart, MessageCircle, Share2, Image as ImageIcon, Send, 
  AlertTriangle, ShieldCheck, ShieldAlert, Award, Globe,
  Eye, CornerDownRight, Plus, Check, BarChart2, Trash2
} from 'lucide-react';
import { Post, User, Comment, Poll } from '../types';

interface FeedViewProps {
  currentUser: User;
  posts: Post[];
  polls: Poll[];
  searchQuery: string;
  onAddPost: (formData: {
    content: string;
    mediaUrl?: string;
    mediaName?: string;
    mediaType?: 'image' | 'video' | 'document' | null;
    isAnnouncement?: boolean;
    announcementCategory?: 'general' | 'emergency' | 'finance';
  }) => Promise<void>;
  onLikePost: (postId: string) => Promise<void>;
  onAddComment: (postId: string, content: string, mediaUrl?: string) => Promise<void>;
  onLikeComment: (postId: string, commentId: string) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
  onVotePoll: (pollId: string, optionId: string) => Promise<void>;
  onAddPoll: (question: string, options: string[]) => Promise<void>;
  onOpenLightbox?: (url: string, caption?: string) => void;
}

export default function FeedView({
  currentUser,
  posts,
  polls,
  searchQuery,
  onAddPost,
  onLikePost,
  onAddComment,
  onLikeComment,
  onDeletePost,
  onVotePoll,
  onAddPoll,
  onOpenLightbox
}: FeedViewProps) {
  // Feed creation states
  const [postContent, setPostContent] = useState('');
  const [attachedUrl, setAttachedUrl] = useState<string | null>(null);
  const [attachedName, setAttachedName] = useState<string | null>(null);
  const [attachedType, setAttachedType] = useState<'image' | 'video' | 'document' | null>(null);
  const [isOfficialAnnouncement, setIsOfficialAnnouncement] = useState(false);
  const [annCategory, setAnnCategory] = useState<'general' | 'emergency' | 'finance'>('general');
  const [isPublishing, setIsPublishing] = useState(false);

  // Poll creation states
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  // Comment drawers tracking per post id
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentInputText, setCommentInputText] = useState<{ [postId: string]: string }>({});
  const [commentAttachedPhoto, setCommentAttachedPhoto] = useState<{ [postId: string]: string | null }>({});

  const handleCommentPhotoChange = (postId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Alleen afbeeldingen zijn toegestaan voor reacties.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedUrl = canvas.toDataURL('image/jpeg', 0.75);
          setCommentAttachedPhoto(prev => ({
            ...prev,
            [postId]: compressedUrl
          }));
        } else {
          setCommentAttachedPhoto(prev => ({
            ...prev,
            [postId]: event.target?.result as string
          }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // File Upload base64 translation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachedName(file.name);
    let type: 'image' | 'video' | 'document' = 'document';
    if (file.type.startsWith('image/')) type = 'image';
    if (file.type.startsWith('video/')) type = 'video';
    setAttachedType(type);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (type === 'image') {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedUrl = canvas.toDataURL('image/jpeg', 0.75);
            setAttachedUrl(compressedUrl);
          } else {
            setAttachedUrl(event.target?.result as string);
          }
        };
        img.src = event.target?.result as string;
      } else {
        setAttachedUrl(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() && !attachedUrl) return;

    setIsPublishing(true);
    try {
      await onAddPost({
        content: postContent,
        mediaUrl: attachedUrl || undefined,
        mediaName: attachedName || undefined,
        mediaType: attachedType,
        isAnnouncement: isOfficialAnnouncement,
        announcementCategory: isOfficialAnnouncement ? annCategory : undefined
      });
      // Clear inputs
      setPostContent('');
      setAttachedUrl(null);
      setAttachedName(null);
      setAttachedType(null);
      setIsOfficialAnnouncement(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCreatePollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOptions = pollOptions.filter(o => o.trim() !== '');
    if (!pollQuestion.trim() || cleanOptions.length < 2) return;

    try {
      await onAddPoll(pollQuestion, cleanOptions);
      setPollQuestion('');
      setPollOptions(['', '']);
      setShowPollCreator(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShareClick = (p: Post) => {
    p.shares += 1;
    alert(`Success: Share link copied for post by ${p.authorName}!`);
  };

  // Searching logic
  const filteredPosts = posts.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.content.toLowerCase().includes(q) ||
      p.authorName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 space-y-6" id="feed-container">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Feed Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Post Composer Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="flex space-x-3.5">
              <img
                src={currentUser.profilePicture}
                alt={currentUser.fullName}
                className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
              <div className="flex-grow">
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder={`What's occurring in Maretraite today, ${currentUser.fullName.split(' ')[0]}?`}
                  rows={3}
                  className="w-full text-sm border-0 focus:ring-0 resize-none bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                  id="feed-post-composer-textarea"
                />

                {/* Display Selected Base64 attachment preview */}
                {attachedUrl && (
                  <div className="relative mt-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 max-h-60 flex justify-center items-center">
                    {attachedType === 'image' ? (
                      <img src={attachedUrl} alt="Attachments Preview" className="h-full max-h-60 object-contain w-auto" />
                    ) : attachedType === 'video' ? (
                      <video src={attachedUrl} className="h-full max-h-60 object-contain" controls />
                    ) : (
                      <div className="p-4 flex items-center space-x-2 text-xs text-slate-500">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Attached document: {attachedName}</span>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setAttachedUrl(null);
                        setAttachedName(null);
                        setAttachedType(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white text-xs"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Official Announcement properties panel for administrators */}
            {currentUser.role === 'admin' && (
              <div className="mt-4 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-xl">
                <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={isOfficialAnnouncement}
                    onChange={(e) => setIsOfficialAnnouncement(e.target.checked)}
                    className="rounded border-slate-300 text-blue-900 focus:ring-blue-900 h-4 w-4"
                  />
                  <span>Mark as Official Announcement</span>
                </label>

                {isOfficialAnnouncement && (
                  <select
                    value={annCategory}
                    onChange={(e: any) => setAnnCategory(e.target.value)}
                    className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300"
                  >
                    <option value="general">📢 General Bulletin</option>
                    <option value="emergency">🚨 Emergency Warning</option>
                    <option value="finance">💰 Financial Update</option>
                  </select>
                )}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <label 
                className="flex items-center space-x-2 px-3 py-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-slate-500 hover:text-blue-900 transition-colors text-xs font-semibold"
                id="file-attachment-label"
              >
                <ImageIcon className="h-4.5 w-4.5 text-green-500" />
                <span>Photo / Video / Doc</span>
                <input
                  type="file"
                  accept="image/*,video/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <button
                disabled={isPublishing || (!postContent.trim() && !attachedUrl)}
                onClick={handleCreatePostSubmit}
                className="bg-blue-900 hover:bg-blue-800 disabled:opacity-40 text-xs font-bold text-white px-5 py-2 rounded-full cursor-pointer transition-all flex items-center space-x-1.5 shadow-sm"
                id="publish-feed-post-btn"
              >
                {isPublishing ? (
                  <span>Publishing AI...</span>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Publish</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Posts Feed */}
          {filteredPosts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-16 text-center border border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-400">No community updates match your search filter</p>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const hasLiked = post.likes.includes(currentUser.id);
              const commentsOpen = activeCommentsPostId === post.id;

              return (
                <div
                  key={post.id}
                  className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border transition-colors overflow-hidden ${
                    post.isAnnouncement 
                      ? post.announcementCategory === 'emergency'
                        ? 'border-red-500 ring-1 ring-red-500/20'
                        : 'border-amber-500 ring-1 ring-amber-500/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                  id={`feed-post-${post.id}`}
                >
                  
                  {/* Announcement Header Accent Banner */}
                  {post.isAnnouncement && (
                    <div className={`px-4 py-1.5 text-[10px] font-bold text-white uppercase tracking-wider flex items-center justify-between ${
                      post.announcementCategory === 'emergency' ? 'bg-red-600' : 'bg-amber-500'
                    }`}>
                      <span>
                        {post.announcementCategory === 'emergency' ? '🚨 EMERGENCY DIRECTIVE' : '📢 OFFICIAL ANNOUNCEMENT'}
                      </span>
                      <span className="opacity-85 text-[9px]">{new Date(post.date).toLocaleDateString()}</span>
                    </div>
                  )}

                  <div className="p-5">
                    {/* Author Meta Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={post.authorAvatar}
                          alt={post.authorName}
                          className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{post.authorName}</h3>
                            {post.authorRole === 'admin' && (
                              <span className="bg-blue-50 text-blue-900 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-200">
                                Official
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center space-x-1">
                            <span>{new Date(post.date).toLocaleDateString()}</span>
                            <span>•</span>
                            <Globe className="h-2.5 w-2.5 text-slate-400" />
                          </p>
                        </div>
                      </div>

                      {/* AI Content Moderation audit status badge */}
                      <div className="flex items-center space-x-2">
                        {post.aiModerated === 'flagged' ? (
                          <div className="flex items-center space-x-1 text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-2.5 py-1 rounded-full text-[10px] font-bold" title={post.aiReviewReason}>
                            <ShieldAlert className="h-3.5 w-3.5" />
                            <span>AI Flagged</span>
                          </div>
                        ) : post.aiModerated === 'clean' ? (
                          <div className="flex items-center space-x-1 text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 px-2.5 py-1 rounded-full text-[10px] font-medium">
                            <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                            <span>AI Verified</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-slate-400 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-full text-[10px] animate-pulse">
                            <span>Auditing...</span>
                          </div>
                        )}

                        {/* Delete post options */}
                        {(post.authorId === currentUser.id || currentUser.role === 'admin' || currentUser.role === 'moderator') && (
                          <button
                            onClick={() => {
                              if (window.confirm("Weet u zeker dat u dit bericht wilt verwijderen?")) {
                                onDeletePost(post.id);
                              }
                            }}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Delete Post"
                            id={`delete-post-${post.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Flagged Warn Panel */}
                    {post.aiModerated === 'flagged' && (
                      <div className="mt-4 p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-start space-x-2">
                        <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0 text-red-600" />
                        <div>
                          <p className="font-bold">Content hidden / flagged for community review</p>
                          <p className="mt-0.5 opacity-90 font-medium">Reason: {post.aiReviewReason || "Violated terms of family safety policy"}</p>
                        </div>
                      </div>
                    )}

                    {/* Post Content */}
                    <div className={post.aiModerated === 'flagged' ? 'opacity-40 mt-3 filter blur-[1px]' : 'mt-4'}>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {post.content}
                      </p>

                      {/* Post Attachments */}
                      {post.mediaUrl && (
                        <div className="mt-4 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 max-h-96 bg-slate-50 dark:bg-slate-950 flex justify-center items-center">
                          {post.mediaType === 'image' ? (
                            <img 
                              src={post.mediaUrl} 
                              alt="Neighbor Share" 
                              className="w-full max-h-96 object-cover cursor-zoom-in hover:scale-[1.01] transition-transform" 
                              onClick={() => onOpenLightbox?.(post.mediaUrl, post.content || 'Neighbor share photo')}
                            />
                          ) : post.mediaType === 'video' ? (
                            <video src={post.mediaUrl} className="w-full max-h-96 object-cover" controls />
                          ) : (
                            <div className="w-full p-6 text-center flex flex-col items-center justify-center space-y-2 bg-slate-100 dark:bg-slate-800">
                              <ImageIcon className="h-8 w-8 text-slate-400" />
                              <span className="text-xs text-blue-900 dark:text-blue-400 font-bold underline cursor-pointer truncate max-w-xs">
                                {post.mediaName || 'Download Document Attachment'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Social Analytics Indicators Row */}
                    <div className="mt-5 flex justify-between items-center text-xs text-slate-400 dark:text-slate-500 border-t border-b border-slate-100 dark:border-slate-800 py-3">
                      <div className="flex items-center space-x-1.5 hover:text-slate-600">
                        <Heart className="h-4 w-4 text-red-500 fill-current" />
                        <span>{post.likes.length} Likes</span>
                      </div>
                      <div className="flex space-x-3.5">
                        <span onClick={() => setActiveCommentsPostId(commentsOpen ? null : post.id)} className="cursor-pointer hover:underline">
                          {post.comments.length} comments
                        </span>
                        <span>{post.shares} shares</span>
                      </div>
                    </div>

                    {/* Action buttons triggers */}
                    <div className="mt-2.5 flex items-center justify-between">
                      <button
                        onClick={() => onLikePost(post.id)}
                        className={`flexItems items-center justify-center flex-1 py-1.5 space-x-2 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/65 cursor-pointer flex transition-colors ${
                          hasLiked ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${hasLiked ? 'fill-current text-red-500' : ''}`} />
                        <span>Like</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveCommentsPostId(commentsOpen ? null : post.id);
                        }}
                        className={`flex-1 py-1.5 space-x-2 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/65 cursor-pointer flex items-center justify-center transition-colors ${
                          commentsOpen ? 'text-blue-900 bg-slate-50 dark:bg-slate-800/60' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>Comment</span>
                      </button>

                      <button
                        onClick={() => handleShareClick(post)}
                        className="flex-1 py-1.5 space-x-2 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/65 cursor-pointer flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors"
                      >
                        <Share2 className="h-4 w-4" />
                        <span>Share</span>
                      </button>
                    </div>

                    {/* Comment Area Drawer Section */}
                    {commentsOpen && (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                        
                        {/* Write Comment Box */}
                        <div className="space-y-2">
                          <div className="flex space-x-2.5 items-center">
                            <img
                              src={currentUser.profilePicture}
                              alt={currentUser.fullName}
                              className="h-8 w-8 rounded-full object-cover border"
                            />
                            <div className="relative flex-grow">
                              <input
                                type="text"
                                value={commentInputText[post.id] || ''}
                                onChange={(e) => setCommentInputText({
                                  ...commentInputText,
                                  [post.id]: e.target.value
                                })}
                                onKeyDown={async (e) => {
                                  if (e.key === 'Enter' && (commentInputText[post.id]?.trim() || commentAttachedPhoto[post.id])) {
                                    await onAddComment(post.id, commentInputText[post.id] || '', commentAttachedPhoto[post.id] || undefined);
                                    setCommentInputText({ ...commentInputText, [post.id]: '' });
                                    setCommentAttachedPhoto({ ...commentAttachedPhoto, [post.id]: null });
                                  }
                                }}
                                placeholder="Write a comment..."
                                className="w-full pl-3 pr-10 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-full text-xs focus:outline-none focus:ring-1 focus:ring-blue-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 border border-slate-100 dark:border-slate-700"
                              />
                              <label className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-900 cursor-pointer transition-colors flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-green-500" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleCommentPhotoChange(post.id, e)}
                                  className="hidden"
                                />
                              </label>
                            </div>
                            <button
                              disabled={!commentInputText[post.id]?.trim() && !commentAttachedPhoto[post.id]}
                              onClick={async () => {
                                await onAddComment(post.id, commentInputText[post.id] || '', commentAttachedPhoto[post.id] || undefined);
                                setCommentInputText({ ...commentInputText, [post.id]: '' });
                                setCommentAttachedPhoto({ ...commentAttachedPhoto, [post.id]: null });
                              }}
                              className="text-blue-900 hover:text-blue-800 disabled:opacity-30 flex-shrink-0 cursor-pointer"
                            >
                              <Send className="h-4 w-4 mr-1" />
                            </button>
                          </div>

                          {/* Preview of attached photo */}
                          {commentAttachedPhoto[post.id] && (
                            <div className="relative inline-block ml-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-750">
                              <img
                                src={commentAttachedPhoto[post.id] || ''}
                                alt="Attached preview"
                                className="max-h-24 w-auto object-cover"
                              />
                              <button
                                onClick={() => setCommentAttachedPhoto({
                                  ...commentAttachedPhoto,
                                  [post.id]: null
                                })}
                                className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-0.5 hover:bg-rose-600 transition-colors shadow cursor-pointer"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* List nested Comments */}
                        {post.comments.length > 0 && (
                          <div className="space-y-3 pt-2">
                            {post.comments.map((comment: Comment) => (
                              <div key={comment.id} className="flex space-x-2.5 items-start">
                                <img
                                  src={comment.authorAvatar}
                                  alt={comment.authorName}
                                  className="h-7 w-7 rounded-full object-cover border"
                                />
                                <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-2xl flex-grow max-w-full">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                      {comment.authorName}
                                    </span>
                                    <span className="text-[9px] text-slate-400">
                                      {new Date(comment.date).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed whitespace-pre-wrap">
                                    {comment.content}
                                  </p>

                                  {comment.mediaUrl && (
                                    <div 
                                      className="mt-2 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 max-h-48 cursor-pointer max-w-xs"
                                      onClick={() => onOpenLightbox?.(comment.mediaUrl!, 'Foto bij reactie')}
                                    >
                                      <img 
                                        src={comment.mediaUrl} 
                                        alt="Comment Attachment" 
                                        className="h-36 w-full object-cover hover:opacity-95 transition-opacity" 
                                      />
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center space-x-2 mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-700/50">
                                    <button
                                      id={`like-comment-btn-${comment.id}`}
                                      onClick={() => onLikeComment(post.id, comment.id)}
                                      className={`flex items-center space-x-1 text-[10px] font-semibold transition-all duration-150 cursor-pointer ${
                                        comment.likes?.includes(currentUser.id)
                                          ? 'text-red-500 hover:text-red-600'
                                          : 'text-slate-400 hover:text-slate-500'
                                      }`}
                                    >
                                      <Heart className={`h-3 w-3 ${comment.likes?.includes(currentUser.id) ? 'fill-current' : ''}`} />
                                      <span>
                                        {comment.likes?.includes(currentUser.id) ? 'Liked' : 'Like'}
                                      </span>
                                    </button>
                                    {comment.likes && comment.likes.length > 0 && (
                                      <span className="text-[10px] text-slate-400 font-medium select-none">
                                        • {comment.likes.length}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              );
            })
          )}

        </div>

        {/* Right Columns Widgets (Community Polls, System Stats) */}
        <div className="space-y-6">
          
          {/* Active Poll Launcher Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center space-x-1.5">
                <BarChart2 className="h-4.5 w-4.5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Community Polls</h3>
              </div>

              {!showPollCreator && (
                <button
                  onClick={() => setShowPollCreator(true)}
                  className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-900 dark:text-blue-400 flex items-center justify-center cursor-pointer"
                  title="Create New Poll"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Poll Creation Panel */}
            {showPollCreator && (
              <form onSubmit={handleCreatePollSubmit} className="space-y-3 bg-slate-50 dark:bg-slate-950/20 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 mb-4 animate-in fade-in duration-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Declare Community Vote</span>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold">Question</label>
                  <input
                    type="text"
                    required
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="E.g., Should we expand Sector 2 speedbumps?"
                    className="w-full text-xs bg-white dark:bg-slate-800 border rounded-lg px-2.5 py-1.5 mt-1 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold block">Choice Options</label>
                  {pollOptions.map((opt, idx) => (
                    <input
                      key={idx}
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...pollOptions];
                        newOpts[idx] = e.target.value;
                        setPollOptions(newOpts);
                      }}
                      placeholder={`Option ${idx + 1}`}
                      className="w-full text-xs bg-white dark:bg-slate-800 border rounded-lg px-2.5 py-1.5 mt-1 text-slate-800 dark:text-slate-100"
                    />
                  ))}

                  {pollOptions.length < 5 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions([...pollOptions, ''])}
                      className="text-[10px] text-blue-900 dark:text-blue-400 underline font-semibold flex items-center hover:opacity-85 mt-1"
                    >
                      + Add Choices
                    </button>
                  )}
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-900 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-blue-800 transition-colors"
                  >
                    Submit Poll
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPollCreator(false);
                      setPollQuestion('');
                      setPollOptions(['', '']);
                    }}
                    className="px-2.5 py-1.5 border hover:bg-slate-55 border-slate-200 dark:border-slate-800 text-slate-500 text-xs rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* View Polls list */}
            {polls.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No active community polls currently open.
              </div>
            ) : (
              <div className="space-y-5">
                {polls.map((poll) => {
                  const totalVotes = poll.options.reduce((acc, o) => acc + o.votes.length, 0);
                  
                  // Track what option user voted for
                  const votedOptionId = poll.options.find(o => o.votes.includes(currentUser.id))?.id;

                  return (
                    <div key={poll.id} className="p-3.5 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl space-y-3">
                      <span className="text-[9px] text-slate-400 font-bold block bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded-md max-w-max">
                        Asked by {poll.authorName}
                      </span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-normal">
                        {poll.question}
                      </p>

                      <div className="space-y-2">
                        {poll.options.map((opt) => {
                          const optionVoteCount = opt.votes.length;
                          const percent = totalVotes > 0 ? Math.round((optionVoteCount / totalVotes) * 100) : 0;
                          const isVoted = votedOptionId === opt.id;

                          return (
                            <button
                              key={opt.id}
                              onClick={() => onVotePoll(poll.id, opt.id)}
                              className={`w-full text-left text-xs p-2.5 rounded-xl border transition-all relative overflow-hidden flex justify-between items-center group cursor-pointer ${
                                isVoted 
                                  ? 'border-blue-900 bg-blue-50/15' 
                                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100/50'
                              }`}
                            >
                              {/* Option voting progress bar graphics inside block */}
                              <div 
                                className="absolute top-0 left-0 bg-blue-900/10 dark:bg-blue-400/10 h-full transition-all duration-500" 
                                style={{ width: `${percent}%` }}
                              />
                              
                              <div className="relative font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                                {isVoted && <Check className="h-3.5 w-3.5 text-blue-900 dark:text-blue-400" />}
                                <span className={isVoted ? 'text-blue-900 dark:text-blue-400 font-bold' : ''}>
                                  {opt.text}
                                </span>
                              </div>
                              <span className="relative text-[10px] text-slate-500 font-bold">
                                {percent}% ({optionVoteCount})
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="text-[10px] text-slate-400 flex justify-between">
                        <span>Total votes: {totalVotes}</span>
                        <span>{new Date(poll.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Surnamese / Maretraite Rules Alert widget */}
          <div className="p-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-850 dark:to-slate-800 border border-emerald-100 dark:border-slate-705 rounded-xl relative overflow-hidden">
            <h4 className="text-xs font-bold text-green-800 dark:text-green-400 uppercase tracking-wider flex items-center space-x-1">
              <ShieldCheck className="h-4 w-4" />
              <span>Buurtrichtlijnen</span>
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              Maretraite Project Network streeft ernaar om veilige en constructieve lokale interactie te bevorderen:
              <br/><br/>
              1. Spreek respectvol met uw buren.<br/>
              2. Plaats geen commerciële advertenties tenzij gemarkeerd als Marktplaats.<br/>
              3. Houd bouw- en wegrapportages objectief en behulpzaam.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
