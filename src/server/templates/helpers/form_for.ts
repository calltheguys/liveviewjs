import { html, safe } from ".."

interface FormForOptions {
  phx_submit?: string
  phx_change?: string
  method?: "get" | "post"
  id?: string
}

// TODO insert hidden input for CSRF token?
export const form_for = <T>(action: string, options?: FormForOptions) => {
  const method = options?.method ?? "post";
  const phx_submit = options?.phx_submit ? safe(` phx-submit="${options.phx_submit}"`) : "";
  const phx_change = options?.phx_change ? safe(` phx-change="${options.phx_change}"`) : "";
  const id = options?.id ? safe(` id="${options.id}"`) : "";
  return html`<form${id} action="${action}" method="${method}"${phx_submit}${phx_change}>`
}