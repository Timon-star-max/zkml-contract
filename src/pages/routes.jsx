import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Main from './main'


const PageRoutes = () => {
  return (
    <>
      <Routes>
        <Route path='/' element={<Main/>} />
      </Routes>
    </>
  )
}

export default PageRoutes