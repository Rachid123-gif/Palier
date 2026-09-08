import { LogoMark, Wordmark } from "@/components/brand/Logo";

export default function BienvenueLoading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center">
      <LogoMark size={56} />
      <Wordmark className="mt-3" />
    </div>
  );
}
