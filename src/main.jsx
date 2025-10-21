import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { Provider } from 'react-redux'
import { store } from './store/store'
import { loginSuccess } from './redux/loginSlice'


try {
  const userString = localStorage.getItem('user')
  const token = localStorage.getItem('token')

  if (userString && token) {
    const user = JSON.parse(userString);
    store.dispatch(loginSuccess({ user, token }))
  }
} catch (error) {
  console.error("Não foi possível carregar o estado do usuário.", error)
  localStorage.clear()
}


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);