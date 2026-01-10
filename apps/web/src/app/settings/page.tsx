'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('account');
  const [userProfile, setUserProfile] = useState({
    name: 'Test User',
    email: 'test@example.com',
    subscriptionTier: 'Pro',
    subscriptionExpiry: '2026-01-15',
  });
  const [telemetrySettings, setTelemetrySettings] = useState({
    defaultTrack: 'Nurburgring GP',
    defaultCar: 'Porsche 911 GT3 RS',
    recordingQuality: 'high',
    autoConnect: true,
    recordSessionStart: true,
  });
  const [displaySettings, setDisplaySettings] = useState({
    theme: 'system',
    dataUpdateFrequency: '60',
    chartColors: 'default',
    showGridLines: true,
    detailedLabels: true,
  });

  const tabItems = [
    { id: 'account', label: 'Account' },
    { id: 'telemetry', label: 'Telemetry' },
    { id: 'display', label: 'Display' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'api', label: 'API Access' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Settings</h1>
        <Link href="/dashboard" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <nav className="space-y-1">
              {tabItems.map((tab) => (
                <button
                  key={tab.id}
                  className={`w-full text-left px-4 py-3 flex items-center space-x-3 ${
                    activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.id === 'account' && (
                    <svg
                      className="h-5 w-5 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  )}
                  {tab.id === 'telemetry' && (
                    <svg
                      className="h-5 w-5 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  )}
                  {tab.id === 'display' && (
                    <svg
                      className="h-5 w-5 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                  {tab.id === 'notifications' && (
                    <svg
                      className="h-5 w-5 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  )}
                  {tab.id === 'api' && (
                    <svg
                      className="h-5 w-5 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                      />
                    </svg>
                  )}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            {activeTab === 'account' && (
              <div>
                <h2 className="text-xl font-bold mb-6">Account Settings</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="form-label">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        className="form-input"
                        value={userProfile.name}
                        onChange={(e) =>
                          setUserProfile({ ...userProfile, name: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="form-label">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        className="form-input"
                        value={userProfile.email}
                        onChange={(e) =>
                          setUserProfile({ ...userProfile, email: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-bold mb-4">Subscription</h3>
                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                      <div>
                        <div className="text-lg font-medium">{userProfile.subscriptionTier} Plan</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Expires: {userProfile.subscriptionExpiry}
                        </div>
                      </div>
                      <button className="btn btn-primary">Manage Subscription</button>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-bold mb-4">Security</h3>
                    <div className="space-y-4">
                      <button className="btn btn-secondary w-full md:w-auto">
                        Change Password
                      </button>
                      <button className="btn btn-secondary w-full md:w-auto">
                        Enable Two-Factor Authentication
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'telemetry' && (
              <div>
                <h2 className="text-xl font-bold mb-6">Telemetry Settings</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="defaultTrack" className="form-label">
                        Default Track
                      </label>
                      <select
                        id="defaultTrack"
                        className="form-input"
                        value={telemetrySettings.defaultTrack}
                        onChange={(e) =>
                          setTelemetrySettings({
                            ...telemetrySettings,
                            defaultTrack: e.target.value,
                          })
                        }
                      >
                        <option value="Nurburgring GP">Nurburgring GP</option>
                        <option value="Spa-Francorchamps">Spa-Francorchamps</option>
                        <option value="Suzuka Circuit">Suzuka Circuit</option>
                        <option value="Monza">Monza</option>
                        <option value="Laguna Seca">Laguna Seca</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="defaultCar" className="form-label">
                        Default Car
                      </label>
                      <select
                        id="defaultCar"
                        className="form-input"
                        value={telemetrySettings.defaultCar}
                        onChange={(e) =>
                          setTelemetrySettings({
                            ...telemetrySettings,
                            defaultCar: e.target.value,
                          })
                        }
                      >
                        <option value="Porsche 911 GT3 RS">Porsche 911 GT3 RS</option>
                        <option value="Ferrari 488 GT3">Ferrari 488 GT3</option>
                        <option value="Mercedes-AMG GT3">Mercedes-AMG GT3</option>
                        <option value="BMW M4 GT3">BMW M4 GT3</option>
                        <option value="Audi R8 LMS">Audi R8 LMS</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="recordingQuality" className="form-label">
                      Recording Quality
                    </label>
                    <select
                      id="recordingQuality"
                      className="form-input"
                      value={telemetrySettings.recordingQuality}
                      onChange={(e) =>
                        setTelemetrySettings({
                          ...telemetrySettings,
                          recordingQuality: e.target.value,
                        })
                      }
                    >
                      <option value="low">Low (30Hz, smaller file size)</option>
                      <option value="medium">Medium (60Hz, balanced)</option>
                      <option value="high">High (120Hz, detailed analysis)</option>
                    </select>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Higher quality recordings capture more data points but result in larger files.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        id="autoConnect"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={telemetrySettings.autoConnect}
                        onChange={(e) =>
                          setTelemetrySettings({
                            ...telemetrySettings,
                            autoConnect: e.target.checked,
                          })
                        }
                      />
                      <label htmlFor="autoConnect" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Automatically connect to PS5 when detected on network
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="recordSessionStart"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={telemetrySettings.recordSessionStart}
                        onChange={(e) =>
                          setTelemetrySettings({
                            ...telemetrySettings,
                            recordSessionStart: e.target.checked,
                          })
                        }
                      />
                      <label htmlFor="recordSessionStart" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Start recording automatically at session start
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'display' && (
              <div>
                <h2 className="text-xl font-bold mb-6">Display Settings</h2>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="theme" className="form-label">
                      Theme
                    </label>
                    <select
                      id="theme"
                      className="form-input"
                      value={displaySettings.theme}
                      onChange={(e) =>
                        setDisplaySettings({
                          ...displaySettings,
                          theme: e.target.value,
                        })
                      }
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System (auto)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="dataUpdateFrequency" className="form-label">
                      Data Update Frequency (Hz)
                    </label>
                    <select
                      id="dataUpdateFrequency"
                      className="form-input"
                      value={displaySettings.dataUpdateFrequency}
                      onChange={(e) =>
                        setDisplaySettings({
                          ...displaySettings,
                          dataUpdateFrequency: e.target.value,
                        })
                      }
                    >
                      <option value="30">30 Hz</option>
                      <option value="60">60 Hz</option>
                      <option value="120">120 Hz</option>
                    </select>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Higher frequencies provide smoother visuals but may affect performance on older devices.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="chartColors" className="form-label">
                      Chart Color Scheme
                    </label>
                    <select
                      id="chartColors"
                      className="form-input"
                      value={displaySettings.chartColors}
                      onChange={(e) =>
                        setDisplaySettings({
                          ...displaySettings,
                          chartColors: e.target.value,
                        })
                      }
                    >
                      <option value="default">Default</option>
                      <option value="highContrast">High Contrast</option>
                      <option value="colorBlind">Color Blind Friendly</option>
                      <option value="monochrome">Monochrome</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        id="showGridLines"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={displaySettings.showGridLines}
                        onChange={(e) =>
                          setDisplaySettings({
                            ...displaySettings,
                            showGridLines: e.target.checked,
                          })
                        }
                      />
                      <label htmlFor="showGridLines" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Show grid lines on charts
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="detailedLabels"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={displaySettings.detailedLabels}
                        onChange={(e) =>
                          setDisplaySettings({
                            ...displaySettings,
                            detailedLabels: e.target.checked,
                          })
                        }
                      />
                      <label htmlFor="detailedLabels" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Show detailed labels and tooltips
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-xl font-bold mb-6">Notification Settings</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Configure how and when you receive notifications about your telemetry data and analysis.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <h3 className="font-medium">Email Notifications</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive analysis reports via email</p>
                    </div>
                    <div className="relative inline-block w-12 h-6 mr-2">
                      <input type="checkbox" id="email-toggle" className="sr-only" defaultChecked />
                      <span className="block h-6 bg-gray-200 rounded-full cursor-pointer transition-colors duration-200 ease-in-out"></span>
                      <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out transform translate-x-0"></span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <h3 className="font-medium">Weekly Performance Summary</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Get a weekly summary of your improvements</p>
                    </div>
                    <div className="relative inline-block w-12 h-6 mr-2">
                      <input type="checkbox" id="weekly-toggle" className="sr-only" defaultChecked />
                      <span className="block h-6 bg-gray-200 rounded-full cursor-pointer transition-colors duration-200 ease-in-out"></span>
                      <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out transform translate-x-0"></span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <h3 className="font-medium">New Feature Announcements</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Be notified about new features and updates</p>
                    </div>
                    <div className="relative inline-block w-12 h-6 mr-2">
                      <input type="checkbox" id="features-toggle" className="sr-only" defaultChecked />
                      <span className="block h-6 bg-gray-200 rounded-full cursor-pointer transition-colors duration-200 ease-in-out"></span>
                      <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out transform translate-x-0"></span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <h3 className="font-medium">Tips & Recommendations</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive driving tips based on your telemetry</p>
                    </div>
                    <div className="relative inline-block w-12 h-6 mr-2">
                      <input type="checkbox" id="tips-toggle" className="sr-only" />
                      <span className="block h-6 bg-gray-200 rounded-full cursor-pointer transition-colors duration-200 ease-in-out"></span>
                      <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out transform translate-x-0"></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div>
                <h2 className="text-xl font-bold mb-6">API Access</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Generate API keys to access your telemetry data programmatically or integrate with other tools.
                </p>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Your API Keys</h3>
                    <button className="btn btn-primary text-sm">Generate New Key</button>
                  </div>
                  
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                      <thead className="bg-gray-100 dark:bg-gray-800">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Used</th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">Development API Key</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">2025-04-15</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">2025-05-20</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-red-600 hover:text-red-900 dark:hover:text-red-400">Revoke</button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">API Documentation</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Our RESTful API allows you to access your telemetry data, perform analysis, and integrate with other tools.
                  </p>
                  <div className="space-x-2">
                    <button className="btn btn-secondary text-sm">View Documentation</button>
                    <button className="btn btn-secondary text-sm">Example Code</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
