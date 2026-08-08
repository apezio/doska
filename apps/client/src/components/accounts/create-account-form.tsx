import { Button, Input } from "@doska/ui-kit"
import { useState } from "react"
import { useCreateAccount } from "@doska/core/mutations"

/** Adds an account: a login and its first password, nothing else. */
export function CreateAccountForm() {
  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const { mutate, isPending, error, reset } = useCreateAccount()

  function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    mutate(
      { login: login.trim(), password },
      {
        onSuccess: () => {
          setLogin("")
          setPassword("")
        },
      }
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="text-sm font-medium">Add an account</div>
      <div className="flex items-center gap-2">
        <Input
          name="new-login"
          autoComplete="off"
          placeholder="Login"
          value={login}
          onChange={(e) => {
            setLogin(e.target.value)
            reset()
          }}
        />
        <Input
          type="password"
          name="new-password"
          autoComplete="new-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !login.trim() || !password}
        >
          {isPending ? "Adding…" : "Add"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </form>
  )
}
