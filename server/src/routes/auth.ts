import { Router, Request, Response } from 'express'
import { generateToken } from '../middleware/auth.js'

const router = Router()

const API_EDITOR_PASSWORD = process.env.API_EDITOR_PASSWORD || ''

router.post('/login', (req: Request, res: Response): void => {
  const { password } = req.body

  if (!API_EDITOR_PASSWORD) {
    // Şifre tanımlı değilse herkese token ver
    res.json({ token: generateToken() })
    return
  }

  if (!password || password !== API_EDITOR_PASSWORD) {
    res.status(401).json({ error: 'Hatalı şifre' })
    return
  }

  res.json({ token: generateToken() })
})

export default router
