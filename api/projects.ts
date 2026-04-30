import { apiRequest } from "@/api/client"

export const projectKeys = {
  list: ["projects"] as const,
}

export type GenerateProjectInput = {
  aspectRatio: string
  model: string
  prompt: string
}

export async function listProjects() {
  const data = await apiRequest<{ projects: string[] }>("/api/projects")

  return data.projects
}

export async function createProject(input: GenerateProjectInput) {
  return apiRequest<{ projectId: string }>("/api/projects", {
    errorMessage: "create_failed",
    method: "POST",
    json: input,
  })
}

export async function generateProjectImage({
  projectId,
  ...input
}: GenerateProjectInput & { projectId: string }) {
  return apiRequest("/api/generate", {
    errorMessage: "generate_failed",
    method: "POST",
    json: {
      projectId,
      ...input,
    },
  })
}

export async function deleteProject(id: string) {
  return apiRequest(`/api/projects/${id}`, {
    errorMessage: "delete_failed",
    method: "DELETE",
  })
}
