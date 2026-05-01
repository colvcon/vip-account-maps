import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import AccountMap from './pages/AccountMap'
import NewAccount from './pages/NewAccount'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/map/:id" element={<AccountMap />} />
      <Route path="/new" element={<NewAccount />} />
    </Routes>
  )
}
