import type { DirectoryUser, Member } from "@doska/contract"
import { orpc } from "./sync/orpc"

export async function listMembers(boardId: string): Promise<Member[]> {
  const { members } = await orpc.members.list({ boardId })
  return members
}

export function addMember(boardId: string, userId: string): Promise<void> {
  return orpc.members.add({ boardId, userId })
}

export function removeMember(boardId: string, userId: string): Promise<void> {
  return orpc.members.remove({ boardId, userId })
}

export async function listDirectory(): Promise<DirectoryUser[]> {
  const { users } = await orpc.users.list()
  return users
}
