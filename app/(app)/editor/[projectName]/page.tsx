import { EditorContent } from "./content"

export default async function Page({
  params,
}: {
  params: Promise<{ projectName: string }>
}) {
  const { projectName } = await params

  return (
    <div className="flex min-h-full items-center justify-center">
      <EditorContent projectId={projectName} />
    </div>
  )
}
