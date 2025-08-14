import AuthWrapper from "../../../components/auth-wrapper"

export default function Settings() {
  return (
    
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Settings</h1>
          <p className="text-gray-600">System configuration and preferences</p>
        </div>
        <div className="text-center py-16 text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {/* <span className="text-2xl">⚙️</span> */}
          </div>
          <p className="text-lg font-medium text-gray-900">Settings</p>
          <p className="text-sm text-gray-600">Coming soon</p>
        </div>
      </div>
    
  )
}
