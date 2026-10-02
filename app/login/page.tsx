import { LoginForm } from "./login-form";

export default async function Login({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return <LoginForm erro={erro === "1"} />;
}
