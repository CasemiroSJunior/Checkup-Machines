import React from "react"

export default function TailwindTestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-lg w-full p-8 bg-white/10 backdrop-blur rounded-lg border border-gray-700">
        <h1 className="text-3xl font-bold text-white mb-4">Tailwind test</h1>
        <p className="text-gray-200 mb-6">If you see this box styled (rounded, shadow, colored), Tailwind is working.</p>
        <div className="grid grid-cols-2 gap-4">
          <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Button</button>
          <button className="px-4 py-2 bg-transparent border border-gray-500 text-white rounded">Outline</button>
        </div>
      </div>
    </div>
  )
}
