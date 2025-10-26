
export type TCursorContent = { createdAt: Date, id: string }

export const cursorEncoder = (entity: TCursorContent) => {
  const cursor = JSON.stringify(entity)
  const encoded = Buffer.from(cursor).toString("base64")
  return encoded
}

export const decodeCursor = (cursor: string): TCursorContent => {
  const decoded = Buffer.from(cursor, "base64").toString()
  return JSON.parse(decoded)
}