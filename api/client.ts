export async function apiRequest<T = void>(
  url: string,
  {
    errorMessage = "request_failed",
    json,
    ...init
  }: Omit<RequestInit, "body"> & {
    errorMessage?: string
    json?: unknown
  } = {}
) {
  const response = await fetch(url, {
    ...init,
    headers:
      json === undefined
        ? init.headers
        : {
            "Content-Type": "application/json",
            ...init.headers,
          },
    body: json === undefined ? undefined : JSON.stringify(json),
  })

  if (!response.ok) {
    throw new Error(errorMessage)
  }

  const text = await response.text()

  return (text ? JSON.parse(text) : undefined) as T
}
