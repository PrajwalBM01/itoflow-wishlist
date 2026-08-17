import { useState } from "react"
import { Check, Loader2, Mail } from "lucide-react"
import { supabase } from "@/lib/supabase"

type Status = "idle" | "loading" | "done" | "error"

export function WaitlistForm() {
  const [email, setEmail] = useState("")
  const [trap, setTrap] = useState("") // honeypot — humans never fill this
  const [status, setStatus] = useState<Status>("idle")
  const [message, setMessage] = useState("")

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    if (status === "loading") return

    // Bot filled the hidden field. Show success, save nothing.
    if (trap) {
      setStatus("done")
      return
    }

    setStatus("loading")

    const { error } = await supabase.from("waitlist").insert({
      email: email.trim().toLowerCase(),
      source: "landing",
      referrer: document.referrer || null,
    })

    if (error) {
      // 23505 = unique violation. They're already on the list, which from the
      // visitor's side is the same outcome as joining. Don't make it an error.
      if (error.code === "23505") {
        setStatus("done")
        setMessage("You're already on the list")
        return
      }
      setStatus("error")
      setMessage("That didn't go through. Try again in a moment.")
      return
    }

    setStatus("done")
    setMessage("You're on the list")
  }

  if (status === "done") {
    return (
      <div className="flex w-full max-w-sm items-center gap-2 rounded-full bg-foreground/60 px-4 py-3 font-mono text-sm text-black shadow-lg">
        <Check className="size-5 shrink-0 text-[#7ccf00]" aria-hidden="true" />
        {message || "You're on the list"}
      </div>
    )
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm items-center rounded-full bg-foreground/60 p-1 pl-3 shadow-lg sm:pl-4"
      >
        <Mail
          strokeWidth={1}
          className="size-5 shrink-0 text-black"
          aria-hidden="true"
        />
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          aria-label="Email address"
          className="min-w-0 flex-1 bg-transparent px-2 text-sm text-black placeholder-neutral-500 outline-0 focus-visible:outline-0"
          placeholder="Enter your email"
        />

        {/* Honeypot. Off-screen rather than display:none — some bots skip
            hidden inputs, but almost all of them fill this one. */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={trap}
          onChange={(e) => setTrap(e.target.value)}
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
        />

        <button
          type="submit"
          disabled={status === "loading"}
          className="flex shrink-0 items-center gap-2 rounded-full bg-black px-3 py-2.5 text-xs whitespace-nowrap text-white transition-opacity focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-70 sm:px-4 sm:text-sm"
        >
          {status === "loading" && (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          Join the wishlist
        </button>
      </form>

      <p
        className="text-center text-xs text-neutral-600 lg:text-left"
        role={status === "error" ? "alert" : undefined}
      >
        {status === "error"
          ? message
          : "No spam, we'll notify you once the beta is ready"}
      </p>
    </>
  )
}
