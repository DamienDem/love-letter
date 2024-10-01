'use server'

import { z } from 'zod'

const createGameSchema = z.object({
  gameName: z.string().min(3),
  numPlayers: z.string().refine((val) => {
    const num = parseInt(val);
    return num >= 2 && num <= 6;
  }),
  creatorName: z.string().min(2),
})

export async function createGame(formData: FormData) {
  const validatedFields = createGameSchema.safeParse({
    gameName: formData.get('gameName'),
    numPlayers: formData.get('numPlayers'),
    creatorName: formData.get('creatorName'),
  })

  if (!validatedFields.success) {
    return { error: 'Validation failed', issues: validatedFields.error.issues }
  }

  // TODO: Implement game creation logic here
  // For example, save to database, create a game session, etc.

  console.log('Creating game:', validatedFields.data)

  return { success: true, gameId: 'some-generated-id' }
}