import React from 'react'

export default class AdminSectionBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown render error',
    }
  }

  componentDidCatch(error, info) {
    console.error(`Admin section failed: ${this.props.title ?? 'Untitled section'}`, error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="dashboard-panel rounded-3xl p-6 shadow-soft">
          <p className="text-sm font-extrabold text-[#0B1F4D]">
            {this.props.title ?? 'Section'} unavailable
          </p>
          <p className="mt-2 text-sm text-slate-600">
            This block failed to render, but the rest of the admin page is still available.
          </p>
          {this.state.message ? (
            <p className="dashboard-subpanel mt-4 rounded-2xl px-4 py-3 text-xs font-semibold text-red-700">
              {this.state.message}
            </p>
          ) : null}
        </div>
      )
    }

    return this.props.children
  }
}
