/** 9. Transitions premium entre pages — fade + léger slide/scale (CSS, jamais brutal). */
export default function ResidentTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
