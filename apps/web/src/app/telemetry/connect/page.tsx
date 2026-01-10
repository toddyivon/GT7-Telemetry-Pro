'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ConnectToPS5Page() {
  const router = useRouter();
  const [ipAddress, setIpAddress] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState('');
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleConnect = async () => {
    if (!ipAddress.trim()) {
      setError('Please enter the IP address of your PS5');
      return;
    }
    
    setConnecting(true);
    setError('');
    setConnectionStatus('Connecting to PS5...');
    
    try {
      // In a real implementation, this would use NenKai's API to connect to the PS5
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsConnected(true);
      setConnectionStatus('Connected to PS5! Gran Turismo 7 detected.');
    } catch (error) {
      console.error('Error connecting to PS5:', error);
      setError('Failed to connect to PS5. Please check the IP address and ensure GT7 is running.');
    } finally {
      setConnecting(false);
    }
  };
  
  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    setConnectionStatus('Recording telemetry data...');
  };
  
  const handleStopRecording = async () => {
    setIsRecording(false);
    setConnectionStatus('Processing recorded data...');
    
    try {
      // In a real implementation, this would process and save the recorded telemetry data
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setConnectionStatus('Telemetry data saved successfully!');
      
      // Navigate to telemetry page after successful recording
      setTimeout(() => {
        router.push('/telemetry');
      }, 1500);
    } catch (error) {
      console.error('Error processing telemetry data:', error);
      setError('Failed to process telemetry data. Please try again.');
      setConnectionStatus('Connected to PS5');
    }
  };
  
  const handleDisconnect = () => {
    if (isRecording) {
      setIsRecording(false);
    }
    
    setIsConnected(false);
    setConnectionStatus('');
    setIpAddress('');
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Connect to PlayStation 5</h1>
        <Link
          href="/telemetry"
          className="btn btn-secondary"
        >
          Back to Sessions
        </Link>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Connection Setup</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Connect to your PlayStation 5 running Gran Turismo 7 to record live telemetry data. Make sure your PS5 and computer are on the same network.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <label htmlFor="ipAddress" className="form-label">
                PlayStation 5 IP Address
              </label>
              <input
                id="ipAddress"
                type="text"
                className="form-input"
                placeholder="e.g., 192.168.1.100"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                disabled={isConnected || connecting}
              />
              <p className="mt-1 text-xs text-gray-500">
                You can find your PS5 IP address in Settings &gt; System &gt; Network &gt; View Connection Status
              </p>
            </div>
            <div>
              {!isConnected ? (
                <button
                  type="button"
                  className="btn btn-primary w-full"
                  onClick={handleConnect}
                  disabled={connecting}
                >
                  {connecting ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Connecting...
                    </span>
                  ) : (
                    'Connect'
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-danger w-full"
                  onClick={handleDisconnect}
                  disabled={connecting}
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>
          
          {error && (
            <div className="mt-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>{error}</p>
            </div>
          )}
          
          {connectionStatus && (
            <div className="mt-4 bg-blue-50 border border-blue-400 text-blue-700 px-4 py-3 rounded">
              <p>{connectionStatus}</p>
            </div>
          )}
        </div>
        
        {isConnected && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-bold mb-4">Telemetry Recording</h2>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Start recording telemetry data from your current GT7 session.
                </p>
                {isRecording && (
                  <div className="flex items-center text-green-600">
                    <span className="relative flex h-3 w-3 mr-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-600"></span>
                    </span>
                    Recording: {formatTime(recordingTime)}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                {!isRecording ? (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleStartRecording}
                  >
                    Start Recording
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleStopRecording}
                  >
                    Stop Recording
                  </button>
                )}
              </div>
            </div>
            
            <div className="mt-6 bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
              <h3 className="font-bold text-lg mb-2">Connection Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status:</p>
                  <p className="font-medium text-green-600">Connected</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">PS5 IP:</p>
                  <p className="font-medium">{ipAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Game:</p>
                  <p className="font-medium">Gran Turismo 7</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Data Rate:</p>
                  <p className="font-medium">60 Hz</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
