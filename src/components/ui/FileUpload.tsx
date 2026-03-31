import React, { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface FileUploadProps {
  onUpload?: (fileKey: string, fileType: string) => void;
  onUploaded?: (key: string) => void; // 兼容旧版调用
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  currentKey?: string | null;
}

const EXTENSION_MAP: Record<string, string> = {
  'pdf': 'pdf', 'md': 'markdown', 'txt': 'txt', 'docx': 'docx', 'pptx': 'pptx',
  'obj': 'obj', 'stl': 'stl', 'fbx': 'fbx', 'gltf': 'gltf', 'glb': 'glb',
  'mp3': 'mp3', 'wav': 'wav', 'flac': 'flac', 'aac': 'aac', 'mp4': 'mp4', 'mkv': 'mkv',
  'gp': 'gp', 'gpx': 'gpx', 'gp5': 'gp5', 'mscz': 'mscz', 'mscx': 'mscx',
  'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'svg': 'image', 'gif': 'image'
};

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onUpload, onUploaded, accept = "*", maxSizeMB = 200, label = "点击或拖拽上传文件", currentKey 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) { setStatus('error'); setErrorMsg(`不能超过 ${maxSizeMB}MB`); return; }
    setStatus('uploading'); setErrorMsg('');
    try {
      // 兼容旧版 Zustand Token 或 LocalStorage
      const stateStr = localStorage.getItem('turtlelet-app');
      const token = stateStr ? JSON.parse(stateStr).state?.token : null;
      if (!token) throw new Error('未授权，请先登录');
      
      const formData = new FormData(); formData.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '上传失败');
      
      setStatus('success');
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const finalKey = data.key || data.data?.file_key;
      if (onUpload) onUpload(finalKey, EXTENSION_MAP[ext] || 'unknown');
      if (onUploaded) onUploaded(finalKey); // 兼容旧接口
      
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) { setStatus('error'); setErrorMsg(err.message); }
  };

  return (
    <div 
      style={{
        position: 'relative', width: '100%', padding: '1.5rem', 
        border: `2px dashed ${isDragging ? 'var(--orange-b)' : status === 'error' ? '#ef4444' : 'var(--border)'}`,
        borderRadius: 'var(--radius)', textAlign: 'center', cursor: 'pointer',
        background: isDragging ? 'rgba(59, 130, 246, 0.1)' : status === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg3)',
        transition: 'all var(--trans)'
      }}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
      onClick={() => inputRef.current?.click()}
    >
      <input type="file" style={{ display: 'none' }} ref={inputRef} onChange={(e) => e.target.files && handleFile(e.target.files[0])} accept={accept} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        {status === 'idle' && <><Upload size={24} color="var(--text3)" /><span style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>{currentKey ? '✓ 已选择新文件' : label}</span></>}
        {status === 'uploading' && <><Loader size={24} color="var(--orange-b)" className="spin" /><span style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>上传中...</span></>}
        {status === 'success' && <><CheckCircle size={24} color="#34d399" /><span style={{ fontSize: '0.85rem', color: '#34d399' }}>成功</span></>}
        {status === 'error' && <><AlertCircle size={24} color="#ef4444" /><span style={{ fontSize: '0.85rem', color: '#ef4444' }}>{errorMsg}</span></>}
      </div>
    </div>
  );
};