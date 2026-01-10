'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TelemetryUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [carModel, setCarModel] = useState('');
  const [track, setTrack] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!sessionName.trim()) {
      newErrors.sessionName = 'Session name is required';
    }
    
    if (!carModel.trim()) {
      newErrors.carModel = 'Car model is required';
    }
    
    if (!track.trim()) {
      newErrors.track = 'Track is required';
    }
    
    if (!file) {
      newErrors.file = 'Telemetry file is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setUploading(true);
    
    try {
      // In a real implementation, this would use Convex to upload the file
      // and create a new telemetry session in the database
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirect to telemetry sessions page
      router.push('/telemetry');
    } catch (error) {
      console.error('Error uploading telemetry file:', error);
      setErrors({
        submit: 'An error occurred while uploading the telemetry data. Please try again.'
      });
    } finally {
      setUploading(false);
    }
  };
  
  const trackOptions = [
    'Select a track',
    'Autodromo de Interlagos',
    'Autodromo Nazionale Monza',
    'Brands Hatch',
    'Circuit de Barcelona-Catalunya',
    'Circuit de la Sarthe',
    'Circuit de Spa-Francorchamps',
    'Deep Forest Raceway',
    'Dragon Trail',
    'Fuji International Speedway',
    'Goodwood Motor Circuit',
    'Kyoto Driving Park',
    'Laguna Seca',
    'Mount Panorama',
    'Nürburgring',
    'Suzuka Circuit',
    'Tokyo Expressway',
    'Trial Mountain',
    'Willow Springs'
  ];
  
  const carManufacturers = [
    'Select a manufacturer',
    'Alfa Romeo',
    'Aston Martin',
    'Audi',
    'BMW',
    'Bugatti',
    'Chevrolet',
    'Dodge',
    'Ferrari',
    'Ford',
    'Honda',
    'Jaguar',
    'Lamborghini',
    'Lexus',
    'Mazda',
    'McLaren',
    'Mercedes-Benz',
    'Nissan',
    'Porsche',
    'Subaru',
    'Toyota',
    'Volkswagen'
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Upload Telemetry Data</h1>
        <Link
          href="/telemetry"
          className="btn btn-secondary"
        >
          Back to Sessions
        </Link>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="sessionName" className="form-label">
                Session Name
              </label>
              <input
                id="sessionName"
                type="text"
                className={`form-input ${errors.sessionName ? 'border-red-500' : ''}`}
                placeholder="e.g., Nürburgring Time Trial"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
              />
              {errors.sessionName && (
                <p className="mt-1 text-sm text-red-600">{errors.sessionName}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="track" className="form-label">
                Track
              </label>
              <select
                id="track"
                className={`form-input ${errors.track ? 'border-red-500' : ''}`}
                value={track}
                onChange={(e) => setTrack(e.target.value)}
              >
                {trackOptions.map((option) => (
                  <option key={option} value={option === 'Select a track' ? '' : option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.track && (
                <p className="mt-1 text-sm text-red-600">{errors.track}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="carModel" className="form-label">
                Car Manufacturer/Model
              </label>
              <select
                id="carModel"
                className={`form-input ${errors.carModel ? 'border-red-500' : ''}`}
                value={carModel}
                onChange={(e) => setCarModel(e.target.value)}
              >
                {carManufacturers.map((option) => (
                  <option key={option} value={option === 'Select a manufacturer' ? '' : option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.carModel && (
                <p className="mt-1 text-sm text-red-600">{errors.carModel}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="telemetryFile" className="form-label">
                Telemetry File (.gtrec)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".gtrec"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">GT7 telemetry file (.gtrec)</p>
                  {file && (
                    <p className="text-sm text-green-600 mt-2">
                      {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>
              </div>
              {errors.file && (
                <p className="mt-1 text-sm text-red-600">{errors.file}</p>
              )}
            </div>
            
            {errors.submit && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p>{errors.submit}</p>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                type="button"
                className="btn btn-secondary mr-3"
                onClick={() => router.push('/telemetry')}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={uploading}
              >
                {uploading ? (
                  <span className="flex items-center">
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
                    Uploading...
                  </span>
                ) : (
                  'Upload Telemetry'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
