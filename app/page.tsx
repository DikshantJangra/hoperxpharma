import Link from "next/link";

export default function Home() {
  return (
    <div className="flex justify-between p-5">
      <h1 className="text-2xl font-medium">
        <span>Hope</span>
        <span className="text-emerald-600 font-bold">rx</span>
        <span>pharma</span>
      </h1>
      <div className="flex gap-4">
        <Link href="/login">Login</Link>
        <Link href="/signup">Signup</Link>
      </div>
    </div>
  )
}