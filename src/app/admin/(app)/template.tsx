/** Admin screens fade in over 180ms when you move between them, and nothing else moves. */
export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  return <div className="admin-fade flex flex-col gap-6">{children}</div>;
}
