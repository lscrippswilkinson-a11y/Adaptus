import { createContext, useContext } from 'react'

/**
 * Lets a stage open the project's Share dialog, which is owned by the Workspace.
 * Null outside a Workspace. Kept in its own module so stages can consume it
 * without importing Workspace (which would be circular).
 */
export const ShareCtx = createContext<(() => void) | null>(null)

export function useShare() {
  return useContext(ShareCtx)
}
