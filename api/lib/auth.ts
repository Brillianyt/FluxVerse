import jwt from 'jsonwebtoken'
import { type Request, type Response, type NextFunction } from 'express'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
  }
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    res.status(401).json({ error: 'Access token required' })
    return
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' })
      return
    }
    req.user = user
    next()
  })
}

export const generateToken = (payload: { id: string; email: string }): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}