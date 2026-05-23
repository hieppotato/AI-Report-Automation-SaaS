import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { AppProviders } from './app/providers'
import { AppRouter } from './app/router'

const App = () => {
  return (
    <Router>
      <AppProviders>
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
          <AppRouter />
        </div>
      </AppProviders>
    </Router>
  )
}

export default App

