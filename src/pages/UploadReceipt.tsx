import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Upload, CheckCircle, XCircle, FileText, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

interface UploadLinkData {
  linkId: string;
  transactionId: string;
  transactionType: string;
  companyName: string;
  expiresAt: string;
  allowedFileTypes: string[];
  maxFileSize: string;
}

const UploadReceipt: React.FC = () => {
  const { linkId } = useParams<{ linkId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [uploadData, setUploadData] = useState<UploadLinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (linkId && token) {
      loadUploadData();
    } else {
      setError('Invalid upload link');
      setLoading(false);
    }
  }, [linkId, token]);

  const loadUploadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/missing-attachments/upload/${linkId}?token=${token}`);
      
      if (response.data.success) {
        setUploadData(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load upload page');
      }
    } catch (err: any) {
      console.error('Error loading upload data:', err);
      setError(err.response?.data?.message || 'Invalid or expired upload link');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
  };

  const validateAndSetFile = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPG, PNG, and PDF files are allowed.');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    setSelectedFile(file);
    toast.success('File selected successfully');
  };

  const handleUpload = async () => {
    if (!selectedFile || !linkId || !token) {
      toast.error('Missing file or upload information');
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('receipt', selectedFile);
      formData.append('token', token);

      const response = await apiClient.post(
        `/missing-attachments/upload/${linkId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        setUploadSuccess(true);
        toast.success('Receipt uploaded successfully!');
      } else {
        toast.error(response.data.message || 'Upload failed');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    return <FileText className="w-8 h-8 text-blue-500" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading upload page...</p>
        </div>
      </div>
    );
  }

  if (error || !uploadData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Link Invalid</h1>
          <p className="text-gray-600 mb-4">
            {error || 'This upload link is invalid or has expired.'}
          </p>
          <p className="text-sm text-gray-500">
            Please contact your accounting team for a new upload link.
          </p>
        </div>
      </div>
    );
  }

  if (uploadSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Successful!</h1>
          <p className="text-gray-600 mb-4">
            Your receipt has been uploaded and attached to the transaction.
          </p>
          <p className="text-sm text-gray-500">
            You can now close this page. The transaction will be updated in your accounting system.
          </p>
        </div>
      </div>
    );
  }

  const expiresAt = new Date(uploadData.expiresAt);
  const isExpiringSoon = expiresAt.getTime() - Date.now() < 24 * 60 * 60 * 1000; // Less than 24 hours

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6">
            <h1 className="text-2xl font-bold mb-2">Upload Receipt</h1>
            <p className="text-blue-100">
              {uploadData.companyName} • {uploadData.transactionType} #{uploadData.transactionId}
            </p>
          </div>

          {/* Expiry Warning */}
          {isExpiringSoon && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
                <p className="text-yellow-800 text-sm">
                  This upload link expires on {expiresAt.toLocaleDateString()} at {expiresAt.toLocaleTimeString()}
                </p>
              </div>
            </div>
          )}

          <div className="p-6">
            {/* Instructions */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Instructions</h2>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Upload a clear photo or PDF of your receipt</li>
                <li>• Accepted formats: JPG, PNG, PDF</li>
                <li>• Maximum file size: {uploadData.maxFileSize}</li>
                <li>• This link can only be used once</li>
              </ul>
            </div>

            {/* File Upload Area */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Receipt File
              </label>
              
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-400 bg-blue-50'
                    : selectedFile
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {selectedFile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-3">
                      {getFileIcon(selectedFile)}
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-gray-600 mb-2">
                        Drag and drop your receipt here, or{' '}
                        <label className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium">
                          browse files
                          <input
                            type="file"
                            className="hidden"
                            accept="image/jpeg,image/png,application/pdf"
                            onChange={handleFileSelect}
                          />
                        </label>
                      </p>
                      <p className="text-xs text-gray-500">JPG, PNG, PDF up to {uploadData.maxFileSize}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                !selectedFile || uploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {uploading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </div>
              ) : (
                'Upload Receipt'
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>This is a secure upload link. Your file will be encrypted and attached to your transaction.</p>
        </div>
      </div>
    </div>
  );
};

export default UploadReceipt;
