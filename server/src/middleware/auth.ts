import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'gr-default-secret-change-me'

export interface AuthRequest extends Request {
  userId?: string
}

export function authRequired(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token gerekli' })
    return
  }

  const token = header.slice(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string }
    req.userId = decoded.role
    next()
  } catch {
    res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token' })
  }
}

export function generateToken(): string {
  return jwt.sign({ role: 'editor' }, JWT_SECRET, { expiresIn: '24h' })
}
