'use client'

import { useState, useEffect } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface SyncStatus {
  totalContacts: number
  importedContacts: number
  lastSync: string | null
  isEnabled: boolean
}

interface SyncResult {
  imported: number
  updated: number
  skipped: number
  skippedDeleted: number
  errors: string[]
}

export default function SyncPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSyncStatus()
  }, [session])

  const fetchSyncStatus = async () => {
    if (!session) return

    try {
      setIsLoading(true)
      const response = await fetch('/api/sync/google/contacts')
      if (response.ok) {
        const data = await response.json()
        setSyncStatus(data.status)
      }
    } catch (err) {
      console.error('Error fetching sync status:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signIn('google', {
        callbackUrl: '/sync',
        scope: 'openid email profile https://www.googleapis.com/auth/contacts.readonly'
      })
    } catch (err) {
      setError('Failed to sign in with Google')
    }
  }

  const handleGoogleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/sync' })
    } catch (err) {
      setError('Failed to sign out')
    }
  }

  const handleSyncContacts = async (forceFullSync: boolean = false) => {
    if (!session) return

    try {
      setIsSyncing(true)
      setError(null)

      const url = forceFullSync ? '/api/sync/google/contacts?force=true' : '/api/sync/google/contacts'
      const response = await fetch(url, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Sync failed')
      }

      const data = await response.json()
      setLastSyncResult(data.result)

      // Refresh sync status
      await fetchSyncStatus()

    } catch (err) {
      setError('Failed to sync contacts')
      console.error('Sync error:', err)
    } finally {
      setIsSyncing(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Google Contacts Sync</h1>
        <p className="mt-2 text-muted-foreground">
          Sync your Google Contacts to automatically import new contacts into your Personal CRM.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive font-medium">Error: {error}</p>
        </div>
      )}

      {!session ? (
        <div className="bg-card p-8 rounded-lg border border-border">
          <div className="text-center">
            <div className="text-6xl mb-4">🔗</div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Connect Google Account</h2>
            <p className="text-muted-foreground mb-6">
              Sign in with Google to enable automatic contact syncing from your Google Contacts.
            </p>
            <button
              onClick={handleGoogleSignIn}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Connected Account */}
          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xl">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Google Account Connected</h3>
                  <p className="text-sm text-muted-foreground">{session.user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleGoogleSignOut}
                className="px-4 py-2 text-sm text-destructive border border-destructive/20 rounded hover:bg-destructive/10"
              >
                Disconnect
              </button>
            </div>
          </div>

          {/* Sync Status */}
          {syncStatus && (
            <div className="bg-card p-6 rounded-lg border border-border">
              <h3 className="font-semibold text-foreground mb-4">Sync Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Contacts:</span>
                    <span className="font-medium">{syncStatus.totalContacts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`font-medium ${syncStatus.isEnabled ? 'text-green-600' : 'text-yellow-600'}`}>
                      {syncStatus.isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Sync:</span>
                    <span className="font-medium">
                      {syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sync Controls */}
          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="font-semibold text-foreground mb-4">Manual Sync</h3>
            <p className="text-muted-foreground mb-4">
              Manually sync your Google Contacts to import new contacts. Existing contacts will be skipped.
            </p>
            <button
              onClick={() => handleSyncContacts()}
              disabled={isSyncing}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSyncing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <span>🔄</span>
                  <span>Sync Now</span>
                </>
              )}
            </button>
          </div>

          {/* Last Sync Result */}
          {lastSyncResult && (
            <div className="bg-card p-6 rounded-lg border border-border">
              <h3 className="font-semibold text-foreground mb-4">Last Sync Result</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{lastSyncResult.imported}</div>
                  <div className="text-sm text-muted-foreground">Imported</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{lastSyncResult.updated}</div>
                  <div className="text-sm text-muted-foreground">Updated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{lastSyncResult.skipped}</div>
                  <div className="text-sm text-muted-foreground">Skipped (Existing)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{lastSyncResult.skippedDeleted || 0}</div>
                  <div className="text-sm text-muted-foreground">Skipped (Deleted)</div>
                </div>
              </div>

              {lastSyncResult.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-destructive mb-2">Errors:</h4>
                  <div className="space-y-1">
                    {lastSyncResult.errors.map((error, index) => (
                      <p key={index} className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="font-semibold text-foreground mb-4">How It Works</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start space-x-2">
                <span className="text-primary mt-0.5">1.</span>
                <span>Contacts are imported from Google with basic information (name, phone, email, address)</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-primary mt-0.5">2.</span>
                <span>Imported contacts have reminders paused by default - you control who gets active CRM management</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-primary mt-0.5">3.</span>
                <span>Set communication frequency on contacts you want to actively manage</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-primary mt-0.5">4.</span>
                <span>Existing contacts are skipped during sync to avoid duplicates</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}