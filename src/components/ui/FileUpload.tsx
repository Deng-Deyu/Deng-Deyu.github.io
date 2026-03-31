import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onUpload: (fileKey: string, fileType: string) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
}

const EXTENSION_MAP: Record<string, string> = {
  'pdf': 'pdf', 'md': 'markdown', 'txt': 'txt', 'docx': 'docx', 'pptx': 'pptx',
  'obj': 'obj', 'stl': 'stl', 'fbx': 'fbx', 'gltf': 'gltf', 'glb': 'glb',
  'mp3': 'mp3', 'wav': 'wav', 'flac': 'flac', 'aac': 'aac', 'mp4': 'mp4', 'mkv': 'mkv',
  'gp': 'gp', 'gpx': 'gpx', 'gp5': 'gp5', 'mscz': 'mscz', 'mscx': 'mscx',
  'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'svg': 'image', 'gif': 'image'
};

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onUpload, accept = "*", maxSizeMB = 200, label = "点击或拖拽上传文件" 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      setStatus('error'); setErrorMsg(`不能超过 ${maxSizeMB}MB`); return;
    }
    setStatus('uploading'); setErrorMsg('');
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('未登录');
      const formData = new FormData(); formData.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '上传失败');
      setStatus('success');
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      onUpload(data.key || data.data?.file_key, EXTENSION_MAP[ext] || 'unknown');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      setStatus('error'); setErrorMsg(err.message);
    }
  };

  return (
    <div 
      className={`relative p-6 border-2 border-dashed rounded-xl transition-all duration-300 text-center cursor-pointer 
        ${isDragging ? 'border-primary bg-primary/10' : 'border-white/20 bg-white/5 hover:bg-white/10'}
        ${status === 'error' ? 'border-red-500 bg-red-500/10' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
      onClick={() => inputRef.current?.click()}
    >
      <input type="file" className="hidden" ref={inputRef} onChange={(e) => e.target.files && handleFile(e.target.files[0])} accept={accept} />
      <div className="flex flex-col items-center gap-2">
        {status === 'idle' && <><UploadCloud className="w-8 h-8 text-gray-400" /><span className="text-sm">{label}</span></>}
        {status === 'uploading' && <><Loader2 className="w-8 h-8 text-primary animate-spin" /><span className="text-sm">上传中...</span></>}
        {status === 'success' && <><CheckCircle className="w-8 h-8 text-green-400" /><span className="text-sm text-green-400">成功</span></>}
        {status === 'error' && <><AlertCircle className="w-8 h-8 text-red-500" /><span className="text-sm text-red-500">{errorMsg}</span></>}
      </div>
    </div>
  );
};