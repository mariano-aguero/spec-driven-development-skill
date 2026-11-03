import { compare } from 'bcryptjs'

const MIN_LENGTH = 12

export const isStrongEnough = (password: string) => password.length >= MIN_LENGTH

export const verifyPassword = (password: string, hash: string) => compare(password, hash)
