export default function Profile() {
  return (
    <div className="space-y-gutter">
      <div className="bg-white border border-gray-200 rounded-card p-4">
        <h1 className="text-xl font-bold text-foreground mb-4">Profile</h1>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <span className="text-xl font-medium text-primary-foreground">
                YN
              </span>
            </div>
            <div>
              <h2 className="text-lg font-medium text-foreground">Your Name</h2>
              <p className="text-muted-foreground">your.email@example.com</p>
            </div>
          </div>

          <div className="space-y-3">
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-md transition-colors">
              <span className="font-medium text-foreground">Settings</span>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-md transition-colors">
              <span className="font-medium text-foreground">Export Data</span>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-md transition-colors">
              <span className="font-medium text-foreground">Theme</span>
            </button>
            <button className="w-full text-left p-3 hover:bg-gray-50 rounded-md transition-colors">
              <span className="font-medium text-destructive">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}